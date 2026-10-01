const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const User = require('../models/User');
const { sendPasswordOtp, sendLoginOtp } = require('../utils/mail');
const { BUSINESS_ROLES } = require('../config/roles');

const signAccessToken = user => jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const serializeUser = user => ({ id: user.id, name: user.full_name, email: user.email, role: user.role, city: user.city, profileImage: user.profile_image });
const otpHash = otp => crypto.createHash('sha256').update(otp).digest('hex');
const loginOtpLifetimeMs = Number(process.env.LOGIN_OTP_TTL_MS || 10 * 60 * 1000);


const Volunteer = require('../models/Volunteer');
const NGO = require('../models/NGO');

exports.register = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const role = (req.body.role || 'restaurant').toLowerCase();
    if (role === 'admin') return res.status(403).json({ success: false, message: 'Administrator accounts can only be created by an existing administrator.' });
    const existing = await User.findByEmail(req.body.email);
    if (existing) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    
    await connection.beginTransaction();
    const password = await bcrypt.hash(req.body.password, 12);
    const [userResult] = await connection.execute(
      `INSERT INTO users
        (full_name, email, mobile, password, role, business_name, address, city, state, pincode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.body.fullName,
        req.body.email.toLowerCase(),
        req.body.mobile || req.body.phone || '',
        password,
        role,
        req.body.businessName || req.body.ngoName || req.body.fullName,
        req.body.address || '',
        req.body.city || '',
        req.body.state || '',
        req.body.pincode || ''
      ]
    );

    const userId = userResult.insertId;

    if (BUSINESS_ROLES.includes(role)) {
      await connection.execute(
        `INSERT INTO business_profiles (user_id, business_name, business_type, account_status)
         VALUES (?, ?, ?, 'active')
         ON DUPLICATE KEY UPDATE business_name = VALUES(business_name), business_type = VALUES(business_type)`,
        [userId, req.body.businessName || req.body.fullName, role]
      );
    } else if (role === 'volunteer') {
      await Volunteer.create(connection, userId, {
        vehicleType: req.body.vehicleType || 'Motorcycle / Scooter',
        drivingLicenseNumber: req.body.drivingLicenseNumber || null
      });
    } else if (role === 'ngo') {
      await NGO.create(connection, userId, {
        ngoName: req.body.ngoName || req.body.fullName,
        registrationNumber: req.body.registrationNumber || null,
        mission: req.body.mission || 'Community food rescue and distribution'
      });
    }

    await connection.commit();
    const user = await User.findPublicById(userId);
    const token = signAccessToken(user);

    return res.status(201).json({ success: true, message: 'Registration successful! Welcome to Food Rescue.', token, user: serializeUser(user) });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

exports.login = async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim();
    const user = await User.findByEmail(email);
    const valid = user && await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Administrators must use the administrator sign-in page.' });
    }

    const isDonorUser = BUSINESS_ROLES.includes(user.role);

    // Check account status
    if (isDonorUser) {
      const [rows] = await pool.execute('SELECT account_status FROM business_profiles WHERE user_id = ? LIMIT 1', [user.id]);
      const status = rows[0]?.account_status || 'active';
      if (status === 'rejected') return res.status(403).json({ success: false, message: 'Your business account application was rejected.' });
      if (status === 'suspended') return res.status(403).json({ success: false, message: 'Your business account has been suspended.' });
    } else if (user.role === 'ngo') {
      const [rows] = await pool.execute('SELECT account_status FROM ngos WHERE user_id = ? LIMIT 1', [user.id]);
      if (rows[0] && rows[0].account_status === 'suspended') return res.status(403).json({ success: false, message: 'Your NGO account has been suspended.' });
    } else if (user.role === 'volunteer') {
      const [rows] = await pool.execute('SELECT account_status FROM volunteers WHERE user_id = ? LIMIT 1', [user.id]);
      if (rows[0] && rows[0].account_status === 'suspended') return res.status(403).json({ success: false, message: 'Your volunteer account has been suspended.' });
    }

    const isDev = process.env.NODE_ENV !== 'production';
    // Volunteer login is outside the current Food Rescue authentication rollout.
    if (isDev && user.role === 'volunteer') {
      return res.json({ success: true, message: 'Signed in successfully.', token: signAccessToken(user), user: serializeUser(user) });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    await User.saveLoginOtp(user.email, otpHash(otp), new Date(Date.now() + loginOtpLifetimeMs));
    
    let mailFailed = false;
    try {
      await sendLoginOtp({ email: user.email, fullName: user.full_name, otp });
    } catch (mailError) {
      mailFailed = true;
      console.warn('Login OTP email delivery notice:', mailError.message || mailError);
    }

    if (mailFailed) {
      await User.clearLoginOtp(user.id);
      return res.status(503).json({ success: false, message: 'We could not deliver a sign-in code. Please try again later.' });
    }

    return res.json({
      success: true,
      requiresOtp: true,
      email: user.email,
      role: user.role,
      message: 'We sent a 6-digit sign-in code to your email. Enter it to finish signing in.'
    });
  } catch (error) { next(error); }
};

exports.verifyLoginOtp = async (req, res, next) => {
  try {
    const user = await User.findByEmail(req.body.email);
    const expired = !user?.login_otp_expires_at || new Date(user.login_otp_expires_at) < new Date();
    const candidateHash = otpHash(req.body.otp);
    if (!user || !user.login_otp || expired || candidateHash !== user.login_otp) {
      return res.status(400).json({ success: false, message: 'The sign-in code is invalid or has expired.' });
    }
    const consumed = await User.consumeLoginOtp(user.id, candidateHash);
    if (!consumed) return res.status(400).json({ success: false, message: 'The sign-in code is invalid or has expired.' });
    await User.markEmailVerified(user.id);
    if (user.role === 'admin') await pool.execute('UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?', [user.id]);
    const publicUser = await User.findPublicById(user.id);
    return res.json({ success: true, message: 'Email verified. Welcome back to Food Rescue.', token: signAccessToken(publicUser), user: serializeUser(publicUser) });
  } catch (error) { next(error); }
};

exports.resendLoginOtp = async (req, res, next) => {
  try {
    const user = await User.findByEmail(req.body.email);
    // Deliberately preserve a uniform response to avoid account enumeration.
    if (!user) return res.json({ success: true, message: 'If that account is eligible, a new sign-in code has been sent.' });
    const otp = crypto.randomInt(100000, 1000000).toString();
    await User.saveLoginOtp(user.email, otpHash(otp), new Date(Date.now() + loginOtpLifetimeMs));
    try {
      await sendLoginOtp({ email: user.email, fullName: user.full_name, otp });
    } catch (mailError) {
      await User.clearLoginOtp(user.id);
      console.warn('Login OTP resend delivery failed.', { code: mailError.code || 'MAIL_DELIVERY_FAILED' });
      return res.status(503).json({ success: false, message: 'We could not deliver a sign-in code. Please try again later.' });
    }
    return res.json({
      success: true,
      message: 'If that account is eligible, a new sign-in code has been sent.'
    });
  } catch (error) { next(error); }
};

exports.logout = async (_req, res) => res.json({ success: true, message: 'Logged out successfully. Remove the JWT from the client.' });

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findByEmail(req.body.email);
    // Keep response uniform so attackers cannot enumerate registered emails.
    if (!user) return res.json({ success: true, message: 'If that email is registered, a reset code has been sent.' });
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await User.saveOtp(user.email, otpHash(otp), expiresAt);
    await sendPasswordOtp({ email: user.email, fullName: user.full_name, otp });
    return res.json({ success: true, message: 'If that email is registered, a reset code has been sent.' });
  } catch (error) { next(error); }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const user = await User.findByEmail(req.body.email);
    const expired = !user?.otp_expires_at || new Date(user.otp_expires_at) < new Date();
    if (!user || !user.otp || expired || otpHash(req.body.otp) !== user.otp) return res.status(400).json({ success: false, message: 'The OTP is invalid or has expired.' });
    const resetToken = jwt.sign({ sub: user.id, purpose: 'password_reset' }, process.env.JWT_SECRET, { expiresIn: process.env.RESET_TOKEN_EXPIRES_IN || '15m' });
    return res.json({ success: true, message: 'OTP verified. You can now reset your password.', resetToken });
  } catch (error) { next(error); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const payload = jwt.verify(req.body.resetToken, process.env.JWT_SECRET);
    if (payload.purpose !== 'password_reset') return res.status(400).json({ success: false, message: 'Invalid password reset token.' });
    const user = await User.findPublicById(payload.sub);
    if (!user) return res.status(400).json({ success: false, message: 'User account was not found.' });
    await User.updatePassword(user.id, await bcrypt.hash(req.body.newPassword, 12));
    return res.json({ success: true, message: 'Password reset successful. Please sign in with your new password.' });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'The password reset token is invalid or has expired.' });
  }
};

exports.profile = async (req, res) => res.json({ success: true, user: serializeUser(req.user) });
