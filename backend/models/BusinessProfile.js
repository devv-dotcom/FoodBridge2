const pool = require('../config/database');

const BusinessProfile = {
  async findByUserId(userId) {
    const [rows] = await pool.execute('SELECT * FROM business_profiles WHERE user_id = ? LIMIT 1', [userId]);
    return rows[0] || null;
  },

  async upsert(connection, userId, data) {
    await connection.execute(
      `INSERT INTO business_profiles (user_id, business_name, business_type)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE business_name = VALUES(business_name), business_type = VALUES(business_type)`,
      [userId, data.businessName, data.businessType]
    );
  }
};

module.exports = BusinessProfile;
