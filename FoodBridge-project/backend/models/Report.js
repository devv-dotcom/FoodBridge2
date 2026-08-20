const pool = require('../config/database');

module.exports = {
  async create(adminId, reportType, reportDate, filters, data) {
    const [result] = await pool.execute('INSERT INTO reports (generated_by, report_type, report_date, filters_json, data_json) VALUES (?, ?, ?, ?, ?)', [adminId, reportType, reportDate, JSON.stringify(filters || {}), JSON.stringify(data)]);
    return result.insertId;
  },
  async list(limit = 20, offset = 0) {
    const [rows] = await pool.execute(`SELECT r.id, r.report_type, r.report_date, r.filters_json, r.data_json, r.created_at, u.full_name AS generated_by_name FROM reports r JOIN admins a ON a.id = r.generated_by JOIN users u ON u.id = a.user_id ORDER BY r.created_at DESC LIMIT ? OFFSET ?`, [limit, offset]);
    return rows;
  }
};
