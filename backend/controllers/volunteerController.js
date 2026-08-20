const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const VolunteerProfile = require('../models/VolunteerProfile');
const PickupRequest = require('../models/PickupRequest');

const tokenFor = user => jwt.sign({ sub: user.id, role: 'volunteer' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicProfile = volunteer => volunteer && ({
  volunteerId: volunteer.volunteer_id,
  fullName: volunteer.full_name,
  email: volunteer.email,
  phone: volunteer.phone,
  address: volunteer.address,
  city: volunteer.city,
  state: volunteer.state,
  pincode: volunteer.pincode,
  profileImage: volunteer.profile_image,
  vehicleType: volunteer.vehicle_type,
  drivingLicenseNumber: volunteer.driving_license_number,
  availability: volunteer.availability,
  rating: Number(volunteer.rating),
  completedDeliveries: volunteer.completed_deliveries,
  createdDate: volunteer.created_at
});

exports.registerVolunteer = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    if (await User.findByEmail(req.body.email)) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    await connection.beginTransaction();
    const password = await bcrypt.hash(req.body.password, 12);
    const [userResult] = await connection.execute(
      `INSERT INTO users (full_name, email, mobile, password, role, address, city, state, pincode)
       VALUES (?, ?, ?, ?, 'volunteer', ?, ?, ?, ?)`,
      [req.body.fullName, req.body.email.toLowerCase(), req.body.phone, password, req.body.address, req.body.city, req.body.state, req.body.pincode]
    );
    await Volunteer.create(connection, userResult.insertId, req.body);
    await connection.commit();
    const user = { id: userResult.insertId, full_name: req.body.fullName };
    return res.status(201).json({ success: true, message: 'Volunteer registration successful.', token: tokenFor(user), user: { id: user.id, name: user.full_name, role: 'volunteer' } });
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
};

exports.loginVolunteer = async (req, res, next) => {
  try {
    const user = await User.findByEmail(req.body.email);
    if (!user || user.role !== 'volunteer' || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid volunteer email or password.' });
    }
    return res.json({ success: true, message: 'Login successful.', token: tokenFor(user), user: { id: user.id, name: user.full_name, role: user.role } });
  } catch (error) { next(error); }
};

exports.logoutVolunteer = (_req, res) => res.json({ success: true, message: 'Logout successful. Remove the JWT from the client application.' });

exports.getProfile = async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findByUserId(req.user.id);
    if (!volunteer) return res.status(404).json({ success: false, message: 'Volunteer profile not found.' });
    return res.json({ success: true, profile: publicProfile(volunteer) });
  } catch (error) { next(error); }
};

exports.updateProfile = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const volunteer = await Volunteer.findByUserId(req.user.id, connection);
    if (!volunteer) return res.status(404).json({ success: false, message: 'Volunteer profile not found.' });
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE users SET full_name = ?, mobile = ?, address = ?, city = ?, state = ?, pincode = ? WHERE id = ?`,
      [req.body.fullName, req.body.phone, req.body.address, req.body.city, req.body.state, req.body.pincode, req.user.id]
    );
    await Volunteer.updateProfile(connection, volunteer.volunteer_id, req.body);
    await connection.commit();
    return res.json({ success: true, message: 'Volunteer profile updated successfully.', profile: publicProfile(await Volunteer.findByUserId(req.user.id)) });
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
};

exports.uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a PNG, JPG, JPEG, or WEBP image no larger than 5MB.' });
    const volunteer = await Volunteer.findByUserId(req.user.id);
    if (!volunteer) return res.status(404).json({ success: false, message: 'Volunteer profile not found.' });
    const imagePath = `/${path.relative(path.join(__dirname, '..'), req.file.path).split(path.sep).join('/')}`;
    await VolunteerProfile.setProfileImage(volunteer.volunteer_id, imagePath);
    return res.status(201).json({ success: true, message: 'Profile photo uploaded successfully.', image: imagePath });
  } catch (error) { next(error); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const user = await User.findByEmail(req.user.email);
    if (!user || !(await bcrypt.compare(req.body.currentPassword, user.password))) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    await User.updatePassword(req.user.id, await bcrypt.hash(req.body.newPassword, 12));
    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) { next(error); }
};

exports.updateAvailability = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const volunteer = await Volunteer.findByUserId(req.user.id, connection);
    if (!volunteer) return res.status(404).json({ success: false, message: 'Volunteer profile not found.' });
    if (volunteer.availability === 'busy' && req.body.availability !== 'busy') {
      const assigned = await PickupRequest.listAssigned(volunteer.volunteer_id);
      if (assigned.some(pickup => !['completed', 'cancelled'].includes(pickup.status))) return res.status(409).json({ success: false, message: 'Finish or cancel your active pickup before changing from busy.' });
    }
    await Volunteer.setAvailability(connection, volunteer.volunteer_id, req.body.availability);
    return res.json({ success: true, message: 'Availability updated successfully.', availability: req.body.availability });
  } catch (error) { next(error); } finally { connection.release(); }
};

exports.getAssignedPickups = async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findByUserId(req.user.id);
    if (!volunteer) return res.status(404).json({ success: false, message: 'Volunteer profile not found.' });
    return res.json({ success: true, pickups: await PickupRequest.listAssigned(volunteer.volunteer_id) });
  } catch (error) { next(error); }
};

exports.pickupHistory = async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findByUserId(req.user.id);
    if (!volunteer) return res.status(404).json({ success: false, message: 'Volunteer profile not found.' });
    return res.json({ success: true, pickups: await PickupRequest.listAssigned(volunteer.volunteer_id, true) });
  } catch (error) { next(error); }
};
