const pool = require('../config/database');

module.exports = {
  async create({ actorUserId, action, entityType, entityId = null, details = null, ipAddress = null }) {
    await pool.execute('INSERT INTO activity_logs (actor_user_id, action, entity_type, entity_id, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)', [actorUserId || null, action, entityType, entityId, details ? JSON.stringify(details) : null, ipAddress]);
  },
  async list(limit = 50, offset = 0) {
    const [rows] = await pool.execute('SELECT l.*, u.full_name AS actor_name, u.email AS actor_email FROM activity_logs l LEFT JOIN users u ON u.id = l.actor_user_id ORDER BY l.created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    return rows;
  }
};
