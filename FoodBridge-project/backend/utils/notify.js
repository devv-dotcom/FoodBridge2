const pool = require('../config/database');

/**
 * Creates an in-system notification for a specific user or role broadcast
 */
async function sendNotification({ recipientUserId = null, targetRole = 'all', title, message, connection = null }) {
  try {
    const executor = connection || pool;
    await executor.execute(
      `INSERT INTO notifications (created_by, recipient_user_id, target_role, title, message, is_read)
       VALUES (NULL, ?, ?, ?, ?, FALSE)`,
      [recipientUserId, targetRole, title, message]
    );
  } catch (error) {
    console.error('[NOTIFY ERROR]', error.message);
  }
}

/**
 * Awards impact points and updates badge level for a user
 */
async function awardPoints(userId, pointsToAdd, connection = null) {
  try {
    const executor = connection || pool;
    await executor.execute(
      `UPDATE users
       SET impact_points = impact_points + ?
       WHERE id = ?`,
      [pointsToAdd, userId]
    );

    // Update badge tier based on total points
    const [rows] = await executor.execute(`SELECT impact_points FROM users WHERE id = ?`, [userId]);
    if (rows.length) {
      const pts = rows[0].impact_points;
      let badge = 'Bronze Hero';
      if (pts >= 2000) badge = 'Platinum Hero 👑';
      else if (pts >= 1000) badge = 'Gold Guardian 🥇';
      else if (pts >= 400) badge = 'Silver Saver 🥈';

      await executor.execute(`UPDATE users SET badge_level = ? WHERE id = ?`, [badge, userId]);
    }
  } catch (error) {
    console.error('[AWARD POINTS ERROR]', error.message);
  }
}

module.exports = {
  sendNotification,
  awardPoints
};
