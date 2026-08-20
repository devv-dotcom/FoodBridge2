const path = require('path');
const pool = require('../config/database');
const Donation = require('../models/Donation');
const DonationImage = require('../models/DonationImage');
const notifStore = require('../services/notifications');

const imagePaths = files => (files || []).map(file => `/${path.relative(path.join(__dirname, '..'), file.path).split(path.sep).join('/')}`);
const pagination = query => ({ limit: Math.min(Math.max(Number(query.limit) || 20, 1), 100), offset: Math.max(Number(query.offset) || 0, 0) });

exports.createDonation = async (req, res, next) => {
  if (!req.files?.length) return res.status(422).json({ success: false, message: 'At least one food image is required for AI authenticity verification.' });
  
  // Fake Food & Spam Listing Detection Engine
  const foodName = (req.body.foodName || '').trim();
  const description = (req.body.description || '').trim();
  const spamRegex = /\b(test|asdf|qwerty|dummy|fake|poison|chemical|garbage|junk|trash|rubbish|inedible)\b/i;
  
  if (foodName.length < 3 || spamRegex.test(foodName) || spamRegex.test(description)) {
    return res.status(422).json({ success: false, message: '⚠️ AI Fraud Detector: Invalid or suspicious food item name/description detected.' });
  }

  const prepTime = new Date(req.body.preparationTime).getTime();
  const expiryTime = new Date(req.body.expiryTime).getTime();
  const now = Date.now();

  if (Number.isNaN(prepTime) || Number.isNaN(expiryTime) || expiryTime <= prepTime) {
    return res.status(422).json({ success: false, message: 'Expiry time must be after preparation time.' });
  }
  
  if (expiryTime <= now) {
    return res.status(422).json({ success: false, message: '⚠️ Food Safety Alert: Expiry time has already passed. Expired food cannot be listed.' });
  }

  const durationHours = (expiryTime - prepTime) / (1000 * 60 * 60);
  if (durationHours > 72) {
    return res.status(422).json({ success: false, message: '⚠️ AI Food Safety Rule: Prepared meals cannot have an expiry duration longer than 72 hours.' });
  }

  if (!req.body.safetyHygiene || !req.body.safetyFreshness || !req.body.safetyPackaging) {
    return res.status(422).json({ success: false, message: 'All food safety checklist items must be verified before publishing a donation.' });
  }
  const connection = await pool.getConnection();
  try {
    if (!await Donation.categoryExists(req.body.categoryId)) return res.status(422).json({ success: false, message: 'Selected food category does not exist.' });
    await connection.beginTransaction();
    const donationId = await Donation.create(connection, req.user.id, req.body);
    await DonationImage.createMany(connection, donationId, imagePaths(req.files));
    await connection.commit();

    // Push a real-time notification to all NGOs & Volunteers
    const saved = await Donation.findById(donationId);
    notifStore.push({
      type:       'NEW_DONATION',
      title:      `🍱 New Food Available: ${saved.food_name}`,
      body:       `${saved.quantity} ready for pickup in ${saved.city || 'your area'} — act fast before it expires!`,
      donationId: donationId,
      donorName:  req.user.business_name || req.user.name || 'A Donor',
      foodName:   saved.food_name,
      quantity:   saved.quantity,
      city:       saved.city || '',
    });

    return res.status(201).json({ success: true, message: 'Donation published successfully with verified food safety.', donation: saved });
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
};

exports.getDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found.' });
    donation.images = await Donation.getImages(donation.id);
    return res.json({ success: true, donation });
  } catch (error) { next(error); }
};

exports.getAllDonations = async (req, res, next) => {
  try { return res.json({ success: true, donations: await Donation.list(pagination(req.query)) }); } catch (error) { next(error); }
};

exports.searchDonation = async (req, res, next) => {
  try {
    const term = `%${(req.query.q || '').trim()}%`;
    if (term === '%%') return res.status(422).json({ success: false, message: 'Provide a search term.' });
    const where = 'WHERE d.food_name LIKE ? OR c.name LIKE ? OR u.city LIKE ? OR u.business_name LIKE ? OR d.status LIKE ?';
    return res.json({ success: true, donations: await Donation.list({ where, values: [term, term, term, term, term], ...pagination(req.query) }) });
  } catch (error) { next(error); }
};

exports.filterDonation = async (req, res, next) => {
  try {
    const clauses = []; const values = [];
    if (req.query.foodType) { clauses.push('d.food_type = ?'); values.push(req.query.foodType); }
    if (req.query.status) { clauses.push('d.status = ?'); values.push(req.query.status); }
    if (req.query.categoryId) { clauses.push('d.category_id = ?'); values.push(Number(req.query.categoryId)); }
    if (req.query.today === 'true') { clauses.push('d.pickup_date = CURDATE()'); }
    if (req.query.city) { clauses.push('u.city = ?'); values.push(req.query.city); }
    if (req.query.latitude && req.query.longitude) {
      const latitude = Number(req.query.latitude);
      const longitude = Number(req.query.longitude);
      const radiusKm = Math.min(Math.max(Number(req.query.radiusKm) || 10, 1), 100);
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) return res.status(422).json({ success: false, message: 'Nearby filtering needs valid latitude and longitude values.' });
      clauses.push('d.latitude IS NOT NULL AND d.longitude IS NOT NULL AND (6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(d.latitude)) * COS(RADIANS(d.longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(d.latitude)))) <= ?');
      values.push(latitude, longitude, latitude, radiusKm);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return res.json({ success: true, donations: await Donation.list({ where, values, ...pagination(req.query) }) });
  } catch (error) { next(error); }
};

exports.updateDonation = async (req, res, next) => {
  try {
    if (!await Donation.categoryExists(req.body.categoryId)) return res.status(422).json({ success: false, message: 'Selected food category does not exist.' });
    const updated = await Donation.update(req.params.id, req.user.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Donation not found, unavailable, or cannot be edited after acceptance.' });
    if (req.files?.length) await DonationImage.addMany(req.params.id, imagePaths(req.files));
    return res.json({ success: true, message: 'Donation updated successfully.', donation: await Donation.findById(req.params.id) });
  } catch (error) { next(error); }
};

exports.deleteDonation = async (req, res, next) => {
  try {
    const deleted = await Donation.delete(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Donation not found or cannot be deleted after acceptance.' });
    return res.json({ success: true, message: 'Donation deleted successfully.' });
  } catch (error) { next(error); }
};
