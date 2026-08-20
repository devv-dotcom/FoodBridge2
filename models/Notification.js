const pool = require('../config/database');

module.exports = {
  async list(limit = 20, offset = 0) {
    const [rows] = await pool.execute(`SELECT n.*, u.full_name AS creator_name FROM notifications n JOIN admins a ON a.id = n.created_by JOIN users u ON u.id = a.user_id ORDER BY n.created_at DESC LIMIT ? OFFSET ?`, [limit, offset]);
    return rows;
  },
  async create(adminId, data) {
    const [result] = await pool.execute('INSERT INTO notifications (created_by, recipient_user_id, target_role, title, message) VALUES (?, ?, ?, ?, ?)', [adminId, data.recipientUserId || null, data.targetRole || 'all', data.title, data.message]);
    return result.insertId;
  },
  async remove(id) { const [result] = await pool.execute('DELETE FROM notifications WHERE id = ?', [id]); return result.affectedRows; },
  async markRead(id, userId) { const [result] = await pool.execute('UPDATE notifications SET is_read = TRUE WHERE id = ? AND (recipient_user_id = ? OR recipient_user_id IS NULL)', [id, userId]); return result.affectedRows; }
};
