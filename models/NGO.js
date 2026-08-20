const pool = require('../config/database');

module.exports = {
  async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT n.*, u.full_name, u.email, u.mobile, u.address, u.city, u.state, u.pincode, p.mission, p.service_area
       FROM ngos n JOIN users u ON u.id = n.user_id LEFT JOIN ngo_profiles p ON p.ngo_id = n.id WHERE n.user_id = ? LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },
  async create(connection, userId, data) {
    const [result] = await connection.execute('INSERT INTO ngos (user_id, ngo_name, registration_number) VALUES (?, ?, ?)', [userId, data.ngoName, data.registrationNumber || null]);
    await connection.execute('INSERT INTO ngo_profiles (ngo_id, mission, service_area) VALUES (?, ?, ?)', [result.insertId, data.mission || null, data.serviceArea || null]);
    return result.insertId;
  },
  async update(connection, ngoId, data) {
    await connection.execute('UPDATE ngos SET ngo_name = ?, registration_number = ? WHERE id = ?', [data.ngoName, data.registrationNumber || null, ngoId]);
    await connection.execute('UPDATE ngo_profiles SET mission = ?, service_area = ? WHERE ngo_id = ?', [data.mission || null, data.serviceArea || null, ngoId]);
  }
};
