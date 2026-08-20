const pool = require('../config/database');

const selectDonation = `
  SELECT d.*, c.name AS category_name, u.business_name, u.full_name AS owner_name, u.city AS business_city,
    (SELECT image_path FROM donation_images WHERE donation_id = d.id ORDER BY id ASC LIMIT 1) AS food_image
  FROM donations d
  JOIN food_categories c ON c.id = d.category_id
  JOIN users u ON u.id = d.business_user_id
`;

const Donation = {
  async categoryExists(categoryId) {
    const [rows] = await pool.execute('SELECT id FROM food_categories WHERE id = ? AND is_active = TRUE LIMIT 1', [categoryId]);
    return Boolean(rows[0]);
  },

  async create(connection, businessUserId, data) {
    const [result] = await connection.execute(
      `INSERT INTO donations (business_user_id, category_id, food_name, food_type, quantity, number_of_meals,
        preparation_time, expiry_time, pickup_date, pickup_time, pickup_address, latitude, longitude, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [businessUserId, data.categoryId, data.foodName, data.foodType, data.quantity, data.numberOfMeals || 0,
        data.preparationTime, data.expiryTime, data.pickupDate, data.pickupTime, data.pickupAddress,
        data.latitude || null, data.longitude || null, data.description || null]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute(`${selectDonation} WHERE d.id = ? AND d.deleted_at IS NULL LIMIT 1`, [id]);
    return rows[0] || null;
  },

  async getImages(donationId) {
    const [rows] = await pool.execute('SELECT id, image_path FROM donation_images WHERE donation_id = ? ORDER BY id ASC', [donationId]);
    return rows;
  },

  async list({ where = '', values = [], limit = 20, offset = 0, includeDeleted = false }) {
    const combinedWhere = includeDeleted ? where : (where ? `${where} AND d.deleted_at IS NULL` : 'WHERE d.deleted_at IS NULL');
    const [rows] = await pool.execute(`${selectDonation} ${combinedWhere} ORDER BY d.created_at DESC LIMIT ? OFFSET ?`, [...values, Number(limit), Number(offset)]);
    return rows;
  },

  async update(id, businessUserId, data) {
    const [result] = await pool.execute(
      `UPDATE donations SET category_id = ?, food_name = ?, food_type = ?, quantity = ?, number_of_meals = ?,
       preparation_time = ?, expiry_time = ?, pickup_date = ?, pickup_time = ?, pickup_address = ?, latitude = ?, longitude = ?, description = ?
       WHERE id = ? AND business_user_id = ? AND status = 'available'`,
      [data.categoryId, data.foodName, data.foodType, data.quantity, data.numberOfMeals || 0, data.preparationTime,
        data.expiryTime, data.pickupDate, data.pickupTime, data.pickupAddress, data.latitude || null,
        data.longitude || null, data.description || null, id, businessUserId]
    );
    return result.affectedRows;
  },

  async delete(id, businessUserId) {
    const [result] = await pool.execute("DELETE FROM donations WHERE id = ? AND business_user_id = ? AND status = 'available'", [id, businessUserId]);
    return result.affectedRows;
  }
};

module.exports = Donation;
