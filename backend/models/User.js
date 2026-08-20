const pool = require('../config/database');

const publicColumns = `
  id, full_name, email, mobile, role, business_name, address, city, state,
  pincode, profile_image, is_verified, created_at, updated_at
`;

const User = {
  async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
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

  async updatePassword(userId, passwordHash) {
    await pool.execute(
      'UPDATE users SET password = ?, otp = NULL, otp_expires_at = NULL WHERE id = ?',
      [passwordHash, userId]
    );
  }
};

module.exports = User;
