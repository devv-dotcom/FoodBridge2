const pool = require('../config/database');

module.exports = {
  async upsert(connection, pickupId, imagePath, notes) {
    await connection.execute(
      `INSERT INTO delivery_proofs (pickup_id, image_path, notes)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE image_path = VALUES(image_path), notes = VALUES(notes), uploaded_at = CURRENT_TIMESTAMP`,
      [pickupId, imagePath, notes || null]
    );
    await connection.execute('UPDATE pickup_requests SET delivery_notes = ? WHERE id = ?', [notes || null, pickupId]);
  },

  async exists(pickupId, connection = pool) {
    const [rows] = await connection.execute('SELECT id FROM delivery_proofs WHERE pickup_id = ? LIMIT 1', [pickupId]);
    return Boolean(rows[0]);
  }
};
