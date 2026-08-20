const pool = require('../config/database');

module.exports = {
  async createMany(connection, donationId, imagePaths) {
    for (const imagePath of imagePaths) {
      await connection.execute('INSERT INTO donation_images (donation_id, image_path) VALUES (?, ?)', [donationId, imagePath]);
    }
  },
  async addMany(donationId, imagePaths) {
    for (const imagePath of imagePaths) await pool.execute('INSERT INTO donation_images (donation_id, image_path) VALUES (?, ?)', [donationId, imagePath]);
  }
};
