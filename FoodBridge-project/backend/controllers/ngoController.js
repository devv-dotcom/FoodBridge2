const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const User = require('../models/User');
const NGO = require('../models/NGO');
const Donation = require('../models/Donation');
const AcceptedDonation = require('../models/AcceptedDonation');

const tokenFor = user => jwt.sign({ sub: user.id, role: 'ngo' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.registerNGO = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    if (await User.findByEmail(req.body.email)) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    await connection.beginTransaction();
    const password = await bcrypt.hash(req.body.password, 12);
    const [userResult] = await connection.execute(
      `INSERT INTO users (full_name, email, mobile, password, role, address, city, state, pincode)
       VALUES (?, ?, ?, ?, 'ngo', ?, ?, ?, ?)`,
      [req.body.fullName, req.body.email.toLowerCase(), req.body.mobile, password, req.body.address, req.body.city, req.body.state, req.body.pincode]
    );
    await NGO.create(connection, userResult.insertId, req.body);
    await connection.commit();
    const user = { id: userResult.insertId, full_name: req.body.fullName, email: req.body.email, role: 'ngo' };
    return res.status(201).json({ success: true, message: 'NGO registration successful.', token: tokenFor(user), user: { id: user.id, name: user.full_name, role: user.role } });
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
};

exports.loginNGO = async (req, res, next) => {
  try {
    const user = await User.findByEmail(req.body.email);
    if (!user || user.role !== 'ngo' || !(await bcrypt.compare(req.body.password, user.password))) return res.status(401).json({ success: false, message: 'Invalid NGO email or password.' });
    return res.json({ success: true, message: 'Login successful.', token: tokenFor(user), user: { id: user.id, name: user.full_name, role: user.role } });
  } catch (error) { next(error); }
};

exports.getProfile = async (req, res, next) => { try { return res.json({ success: true, profile: await NGO.findByUserId(req.user.id) }); } catch (error) { next(error); } };
exports.updateProfile = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const ngo = await NGO.findByUserId(req.user.id);
    if (!ngo) return res.status(404).json({ success: false, message: 'NGO profile not found.' });
    await connection.beginTransaction();
    await connection.execute('UPDATE users SET full_name = ?, mobile = ?, address = ?, city = ?, state = ?, pincode = ? WHERE id = ?', [req.body.fullName, req.body.mobile, req.body.address, req.body.city, req.body.state, req.body.pincode, req.user.id]);
    await NGO.update(connection, ngo.id, req.body);
    await connection.commit();
    return res.json({ success: true, message: 'NGO profile updated successfully.', profile: await NGO.findByUserId(req.user.id) });
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
};
exports.browseDonations = async (req, res, next) => { try { return res.json({ success: true, donations: await Donation.list({ where: "WHERE d.status = 'available'", limit: req.query.limit || 20, offset: req.query.offset || 0 }) }); } catch (error) { next(error); } };
exports.acceptDonation = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const ngo = await NGO.findByUserId(req.user.id);
    if (!ngo || ngo.account_status !== 'active') return res.status(403).json({ success: false, message: 'Your NGO account is not active.' });
    await connection.beginTransaction();
    const accepted = await AcceptedDonation.accept(connection, req.params.id, ngo.id);
    if (!accepted) { await connection.rollback(); return res.status(409).json({ success: false, message: 'This donation is no longer available.' }); }
    await connection.commit();
    return res.json({ success: true, message: 'Donation accepted successfully.' });
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
};
exports.history = async (req, res, next) => { try { const ngo = await NGO.findByUserId(req.user.id); return res.json({ success: true, donations: ngo ? await AcceptedDonation.history(ngo.id) : [] }); } catch (error) { next(error); } };
exports.confirmDelivery = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const ngo = await NGO.findByUserId(req.user.id);
    if (!ngo) return res.status(404).json({ success: false, message: 'NGO not found.' });
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `UPDATE donations d
       JOIN accepted_donations ad ON ad.donation_id = d.id
       SET d.status = 'completed', ad.status = 'completed'
       WHERE d.id = ? AND ad.ngo_id = ? AND d.status IN ('delivered', 'picked_up', 'accepted')`,
      [req.params.id, ngo.id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Donation delivery cannot be confirmed at this stage or does not belong to your NGO.' });
    }
    await connection.execute(`UPDATE pickup_requests SET status = 'completed' WHERE donation_id = ?`, [req.params.id]);
    await connection.commit();
    return res.json({ success: true, message: 'Delivery confirmed successfully! Donation marked as completed.' });
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
};
