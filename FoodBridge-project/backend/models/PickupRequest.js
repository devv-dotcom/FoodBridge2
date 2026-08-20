const pool = require('../config/database');

const pickupSelect = `
  SELECT pr.*, d.food_name, d.food_type, d.quantity, d.number_of_meals, d.expiry_time,
    bu.business_name, bu.full_name AS business_contact_name, bu.mobile AS business_phone,
    nu.full_name AS ngo_contact_name, n.ngo_name, nup.address AS ngo_address,
    nup.city AS ngo_city, nup.state AS ngo_state, nup.pincode AS ngo_pincode,
    v.user_id AS volunteer_user_id, vu.full_name AS volunteer_name, vu.mobile AS volunteer_phone,
    dp.id AS delivery_proof_id, dp.image_path AS delivery_proof_image, dp.notes AS delivery_proof_notes, dp.uploaded_at AS proof_uploaded_at
  FROM pickup_requests pr
  JOIN donations d ON d.id = pr.donation_id
  JOIN users bu ON bu.id = pr.business_id
  JOIN ngos n ON n.id = pr.ngo_id
  JOIN users nu ON nu.id = n.user_id
  LEFT JOIN ngo_profiles nup ON nup.ngo_id = n.id
  LEFT JOIN volunteers v ON v.id = pr.volunteer_id
  LEFT JOIN users vu ON vu.id = v.user_id
  LEFT JOIN delivery_proofs dp ON dp.pickup_id = pr.id`;

module.exports = {
  async createForAcceptedDonation(connection, donationId, ngoId) {
    const [rows] = await connection.execute(
      `SELECT d.id, d.business_user_id, d.pickup_date, d.pickup_time, d.pickup_address,
        n.user_id AS ngo_user_id, u.address, u.city, u.state, u.pincode
       FROM donations d JOIN ngos n ON n.id = ? JOIN users u ON u.id = n.user_id WHERE d.id = ? LIMIT 1`,
      [ngoId, donationId]
    );
    const donation = rows[0];
    if (!donation) throw new Error('Accepted donation could not be prepared for pickup.');
    const deliveryAddress = [donation.address, donation.city, donation.state, donation.pincode].filter(Boolean).join(', ');
    const [result] = await connection.execute(
      `INSERT INTO pickup_requests (donation_id, ngo_id, business_id, pickup_date, pickup_time, pickup_address, delivery_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [donation.id, ngoId, donation.business_user_id, donation.pickup_date, donation.pickup_time, donation.pickup_address, deliveryAddress]
    );
    return result.insertId;
  },

  async listAvailable(limit = 20, offset = 0) {
    const [rows] = await pool.execute(
      `${pickupSelect} WHERE pr.volunteer_id IS NULL AND pr.status = 'pending' ORDER BY pr.pickup_date ASC, pr.pickup_time ASC LIMIT ? OFFSET ?`,
      [Number(limit), Number(offset)]
    );
    return rows;
  },

  async findById(id, connection = pool, lock = false) {
    const [rows] = await connection.execute(`${pickupSelect} WHERE pr.id = ? LIMIT 1${lock ? ' FOR UPDATE' : ''}`, [id]);
    return rows[0] || null;
  },

  async listAssigned(volunteerId, completed = false) {
    const condition = completed ? "pr.status IN ('completed', 'cancelled')" : "pr.status NOT IN ('completed', 'cancelled')";
    const [rows] = await pool.execute(
      `${pickupSelect} WHERE pr.volunteer_id = ? AND ${condition} ORDER BY pr.pickup_date DESC, pr.pickup_time DESC`,
      [volunteerId]
    );
    return rows;
  },

  async assign(connection, pickupId, volunteerId) {
    const [result] = await connection.execute(
      `UPDATE pickup_requests SET volunteer_id = ?, status = 'volunteer_assigned'
       WHERE id = ? AND volunteer_id IS NULL AND status = 'pending'`,
      [volunteerId, pickupId]
    );
    return result.affectedRows;
  },

  async updateStatus(connection, pickupId, volunteerId, fromStatuses, status, values = []) {
    const marks = fromStatuses.map(() => '?').join(', ');
    const [result] = await connection.execute(
      `UPDATE pickup_requests SET status = ?, ${values.length ? 'delivery_time = ?,' : ''} updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND volunteer_id = ? AND status IN (${marks})`,
      [status, ...values, pickupId, volunteerId, ...fromStatuses]
    );
    return result.affectedRows;
  }
};
