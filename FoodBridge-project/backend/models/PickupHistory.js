module.exports = {
  async create(connection, pickup) {
    await connection.execute(
      `INSERT INTO pickup_history (pickup_id, donation_id, volunteer_id, ngo_id, business_id, status, completed_at)
       VALUES (?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE status = 'completed', completed_at = CURRENT_TIMESTAMP`,
      [pickup.id, pickup.donation_id, pickup.volunteer_id, pickup.ngo_id, pickup.business_id]
    );
  }
};
