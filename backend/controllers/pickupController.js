const path = require('path');
const pool = require('../config/database');
const Volunteer = require('../models/Volunteer');
const PickupRequest = require('../models/PickupRequest');
const DeliveryProof = require('../models/DeliveryProof');
const PickupHistory = require('../models/PickupHistory');

const ensureVolunteer = async (userId, connection) => {
  const volunteer = await Volunteer.findByUserId(userId, connection);
  if (!volunteer) {
    const error = new Error('Volunteer profile not found.');
    error.statusCode = 404;
    throw error;
  }
  return volunteer;
};

const updateLinkedDonation = async (connection, pickup, donationStatus, acceptedStatus) => {
  await connection.execute('UPDATE donations SET status = ? WHERE id = ?', [donationStatus, pickup.donation_id]);
  await connection.execute('UPDATE accepted_donations SET status = ? WHERE donation_id = ?', [acceptedStatus, pickup.donation_id]);
};

const ownedPickup = async (connection, pickupId, volunteerId) => {
  const pickup = await PickupRequest.findById(pickupId, connection, true);
  if (!pickup) return { error: { status: 404, message: 'Pickup request not found.' } };
  if (pickup.volunteer_id !== volunteerId) return { error: { status: 403, message: 'This pickup is not assigned to you.' } };
  return { pickup };
};

exports.getPickupRequests = async (req, res, next) => {
  try {
    await ensureVolunteer(req.user.id, pool);
    return res.json({ success: true, pickups: await PickupRequest.listAvailable(req.query.limit || 20, req.query.offset || 0) });
  } catch (error) { next(error); }
};

exports.getPickupById = async (req, res, next) => {
  try {
    const volunteer = await ensureVolunteer(req.user.id, pool);
    const pickup = await PickupRequest.findById(req.params.id);
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup request not found.' });
    if (pickup.volunteer_id && pickup.volunteer_id !== volunteer.volunteer_id) return res.status(403).json({ success: false, message: 'You do not have permission to view this pickup.' });
    return res.json({ success: true, pickup });
  } catch (error) { next(error); }
};

exports.acceptPickup = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const volunteer = await ensureVolunteer(req.user.id, connection);
    if (volunteer.availability !== 'online') { await connection.rollback(); return res.status(409).json({ success: false, message: 'Set your availability to online before accepting a pickup.' }); }
    const pickup = await PickupRequest.findById(req.params.id, connection, true);
    if (!pickup || pickup.status !== 'pending' || pickup.volunteer_id) { await connection.rollback(); return res.status(409).json({ success: false, message: 'This pickup is no longer available.' }); }
    if (!(await PickupRequest.assign(connection, pickup.id, volunteer.volunteer_id))) { await connection.rollback(); return res.status(409).json({ success: false, message: 'This pickup is no longer available.' }); }
    await Volunteer.setAvailability(connection, volunteer.volunteer_id, 'busy');
    await updateLinkedDonation(connection, pickup, 'volunteer_assigned', 'volunteer_assigned');
    await connection.commit();
    return res.json({ success: true, message: 'Pickup Accepted Successfully' });
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
};

const transition = (fromStatuses, nextStatus, message, setDeliveryTime = false) => async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const volunteer = await ensureVolunteer(req.user.id, connection);
    const result = await ownedPickup(connection, req.params.id, volunteer.volunteer_id);
    if (result.error) { await connection.rollback(); return res.status(result.error.status).json({ success: false, message: result.error.message }); }
    const { pickup } = result;
    const updated = await PickupRequest.updateStatus(connection, pickup.id, volunteer.volunteer_id, fromStatuses, nextStatus, setDeliveryTime ? [new Date()] : []);
    if (!updated) { await connection.rollback(); return res.status(409).json({ success: false, message: `Pickup cannot be marked as ${nextStatus.replace('_', ' ')} from its current status.` }); }
    const donationStatus = nextStatus === 'pickup_started' ? 'volunteer_assigned' : nextStatus === 'food_collected' ? 'picked_up' : 'delivered';
    const acceptedStatus = nextStatus === 'pickup_started' ? 'volunteer_assigned' : nextStatus === 'food_collected' ? 'picked_up' : 'delivered';
    await updateLinkedDonation(connection, pickup, donationStatus, acceptedStatus);
    await connection.commit();
    return res.json({ success: true, message });
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
};

exports.startPickup = transition(['volunteer_assigned'], 'pickup_started', 'Pickup started successfully.');
exports.collectFood = transition(['pickup_started'], 'food_collected', 'Food collected successfully.');
exports.deliverFood = transition(['food_collected', 'on_the_way'], 'delivered', 'Food delivered successfully.', true);

exports.completePickup = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const volunteer = await ensureVolunteer(req.user.id, connection);
    const result = await ownedPickup(connection, req.params.id, volunteer.volunteer_id);
    if (result.error) { await connection.rollback(); return res.status(result.error.status).json({ success: false, message: result.error.message }); }
    const { pickup } = result;
    if (pickup.status !== 'delivered') { await connection.rollback(); return res.status(409).json({ success: false, message: 'Only delivered pickups can be completed.' }); }
    if (!(await DeliveryProof.exists(pickup.id, connection))) { await connection.rollback(); return res.status(422).json({ success: false, message: 'A delivery proof image is required before completing delivery.' }); }
    if (!(await PickupRequest.updateStatus(connection, pickup.id, volunteer.volunteer_id, ['delivered'], 'completed'))) { await connection.rollback(); return res.status(409).json({ success: false, message: 'Pickup status changed. Please refresh and try again.' }); }
    await updateLinkedDonation(connection, pickup, 'completed', 'completed');
    await PickupHistory.create(connection, pickup);
    await connection.execute('UPDATE volunteers SET completed_deliveries = completed_deliveries + 1, availability = \'online\' WHERE id = ?', [volunteer.volunteer_id]);
    await connection.commit();
    return res.json({ success: true, message: 'Delivery Completed Successfully' });
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
};

exports.uploadDeliveryProof = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'A PNG, JPG, JPEG, or WEBP delivery proof image is required.' });
    await connection.beginTransaction();
    const volunteer = await ensureVolunteer(req.user.id, connection);
    const result = await ownedPickup(connection, req.params.id, volunteer.volunteer_id);
    if (result.error) { await connection.rollback(); return res.status(result.error.status).json({ success: false, message: result.error.message }); }
    if (!['food_collected', 'on_the_way', 'delivered'].includes(result.pickup.status)) { await connection.rollback(); return res.status(409).json({ success: false, message: 'Delivery proof can be added after food has been collected.' }); }
    const imagePath = `/${path.relative(path.join(__dirname, '..'), req.file.path).split(path.sep).join('/')}`;
    await DeliveryProof.upsert(connection, result.pickup.id, imagePath, req.body.notes);
    await connection.commit();
    return res.status(201).json({ success: true, message: 'Delivery proof uploaded successfully.', image: imagePath });
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
};
