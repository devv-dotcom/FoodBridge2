const pool = require('../config/database');

const profileSelect = `
  SELECT v.id AS volunteer_id, v.user_id, v.vehicle_type, v.driving_license_number,
    v.availability, v.account_status, v.rating, v.completed_deliveries, v.created_at AS volunteer_created_at,
    u.full_name, u.email, u.mobile AS phone, u.address, u.city, u.state, u.pincode,
    u.profile_image, u.created_at, u.updated_at
  FROM volunteers v JOIN users u ON u.id = v.user_id`;

module.exports = {
  async findByUserId(userId, connection = pool) {
    const [rows] = await connection.execute(`${profileSelect} WHERE v.user_id = ? LIMIT 1`, [userId]);
    return rows[0] || null;
  },

  async create(connection, userId, data) {
    const [result] = await connection.execute(
      `INSERT INTO volunteers (user_id, vehicle_type, driving_license_number, availability)
       VALUES (?, ?, ?, 'offline')`,
      [userId, data.vehicleType, data.drivingLicenseNumber || null]
    );
    await connection.execute('INSERT INTO volunteer_profiles (volunteer_id) VALUES (?)', [result.insertId]);
    return result.insertId;
  },

  async updateProfile(connection, volunteerId, data) {
    await connection.execute(
      'UPDATE volunteers SET vehicle_type = ?, driving_license_number = ? WHERE id = ?',
      [data.vehicleType, data.drivingLicenseNumber || null, volunteerId]
    );
  },

  async setAvailability(connection, volunteerId, availability) {
    await connection.execute('UPDATE volunteers SET availability = ? WHERE id = ?', [availability, volunteerId]);
  }
};
