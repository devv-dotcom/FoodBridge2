const pool = require('../config/database');

module.exports = {
  async setProfileImage(volunteerId, imagePath) {
    await pool.execute('UPDATE volunteer_profiles SET profile_image = ? WHERE volunteer_id = ?', [imagePath, volunteerId]);
    await pool.execute(
      `UPDATE users u JOIN volunteers v ON v.user_id = u.id
       SET u.profile_image = ? WHERE v.id = ?`,
      [imagePath, volunteerId]
    );
  }
};
