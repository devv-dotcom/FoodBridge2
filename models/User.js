const pool = require('../config/database');

const publicColumns = `
  id, full_name, email, mobile, role, business_name, address, city, state,
  pincode, profile_image, is_verified, created_at, updated_at
`;

const User = {
  async findByEmail(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const [rows] = await pool.execute('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [cleanEmail]);
    return rows[0] || null;
  },

  async findPublicById(id) {
    const [rows] = await pool.execute(`SELECT ${publicColumns} FROM users WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  },

  async create(data) {
    const sql = `
      INSERT INTO users
        (full_name, email, mobile, password, role, business_name, address, city, state, pincode, profile_image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      data.fullName,
      data.email,
      data.mobile,
      data.password,
      data.role,
      data.businessName || null,
      data.address,
      data.city,
      data.state,
      data.pincode,
      data.profileImage || null
    ];
    const [result] = await pool.execute(sql, values);
    return this.findPublicById(result.insertId);
  },

  async saveOtp(email, otpHash, expiresAt) {
    await pool.execute('UPDATE users SET otp = ?, otp_expires_at = ? WHERE email = ?', [otpHash, expiresAt, email]);
  },

  async clearOtp(userId) {
    await pool.execute('UPDATE users SET otp = NULL, otp_expires_at = NULL WHERE id = ?', [userId]);
  },

  async saveLoginOtp(email, otpHash, expiresAt) {
    try {
      await pool.execute('UPDATE users SET login_otp = ?, login_otp_expires_at = ? WHERE email = ?', [otpHash, expiresAt, email]);
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        try {
          await pool.execute("ALTER TABLE users ADD COLUMN login_otp VARCHAR(255) NULL, ADD COLUMN login_otp_expires_at DATETIME NULL");
        } catch (_) {}
        await pool.execute('UPDATE users SET login_otp = ?, login_otp_expires_at = ? WHERE email = ?', [otpHash, expiresAt, email]);
      } else {
        throw err;
      }
    }
  },

  async clearLoginOtp(userId) {
    await pool.execute('UPDATE users SET login_otp = NULL, login_otp_expires_at = NULL WHERE id = ?', [userId]);
  },

  async consumeLoginOtp(userId, otpHash) {
    const [result] = await pool.execute(
      'UPDATE users SET login_otp = NULL, login_otp_expires_at = NULL WHERE id = ? AND login_otp = ? AND login_otp_expires_at > ?',
      [userId, otpHash, new Date()]
    );
    return result.affectedRows === 1;
  },
  async markEmailVerified(userId) {
    await pool.execute('UPDATE users SET is_verified = TRUE WHERE id = ?', [userId]);
  },

  async updatePassword(userId, passwordHash) {
    await pool.execute(
      'UPDATE users SET password = ?, otp = NULL, otp_expires_at = NULL, login_otp = NULL, login_otp_expires_at = NULL WHERE id = ?',
      [passwordHash, userId]
    );
  }
};

module.exports = User;
