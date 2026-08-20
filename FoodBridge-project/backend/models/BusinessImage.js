const pool = require('../config/database');

const BusinessImage = {
  async findByUserId(userId) {
    const [rows] = await pool.execute('SELECT image_type, image_path FROM business_images WHERE user_id = ?', [userId]);
    return rows.reduce((images, row) => ({ ...images, [row.image_type]: row.image_path }), {});
  },

  async upsert(userId, imageType, imagePath) {
    await pool.execute(
      `INSERT INTO business_images (user_id, image_type, image_path) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE image_path = VALUES(image_path)`,
      [userId, imageType, imagePath]
    );
  }
};

module.exports = BusinessImage;
