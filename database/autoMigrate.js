const pool = require('../config/database');

async function runAutoMigration() {
  try {
    const connection = await pool.getConnection();
    try {
      const dbName = process.env.DB_NAME || 'foodbridge';

      const helperCheckColumn = async (table, column) => {
        const [rows] = await connection.query(
          `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [dbName, table, column]
        );
        return rows[0].cnt > 0;
      };

      // 1. Users table additions
      if (!(await helperCheckColumn('users', 'impact_points'))) {
        await connection.query(`ALTER TABLE users ADD COLUMN impact_points INT UNSIGNED NOT NULL DEFAULT 0 AFTER is_verified`);
        console.log('[MIGRATION] Added users.impact_points');
      }
      if (!(await helperCheckColumn('users', 'badge_level'))) {
        await connection.query(`ALTER TABLE users ADD COLUMN badge_level VARCHAR(50) NOT NULL DEFAULT 'Bronze Hero' AFTER impact_points`);
        console.log('[MIGRATION] Added users.badge_level');
      }
      if (!(await helperCheckColumn('users', 'latitude'))) {
        await connection.query(`ALTER TABLE users ADD COLUMN latitude DECIMAL(10,7) NULL AFTER pincode, ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude`);
        console.log('[MIGRATION] Added users.latitude/longitude');
      }

      // 2. Donations table additions
      if (!(await helperCheckColumn('donations', 'is_emergency'))) {
        await connection.query(`ALTER TABLE donations ADD COLUMN is_emergency BOOLEAN NOT NULL DEFAULT FALSE AFTER status`);
        console.log('[MIGRATION] Added donations.is_emergency');
      }

      // 3. Pickup Requests additions for live tracking
      if (!(await helperCheckColumn('pickup_requests', 'current_latitude'))) {
        await connection.query(`ALTER TABLE pickup_requests ADD COLUMN current_latitude DECIMAL(10,7) NULL AFTER delivery_notes, ADD COLUMN current_longitude DECIMAL(10,7) NULL AFTER current_latitude, ADD COLUMN last_location_updated_at DATETIME NULL AFTER current_longitude`);
        console.log('[MIGRATION] Added pickup_requests live GPS tracking columns');
      }

      // 4. Notifications nullable created_by
      try {
        await connection.query(`ALTER TABLE notifications MODIFY COLUMN created_by BIGINT UNSIGNED NULL`);
      } catch (err) {
        // Ignored if already modified or constraint prevents
      }

      console.log('[MIGRATION] Food Rescue Database V3 Schema verified.');
    } finally {
      connection.release();
    }
  } catch (err) {
    console.warn('[MIGRATION] Auto-migration skipped or database offline:', err.message);
  }
}

module.exports = runAutoMigration;
module.exports.runAutoMigration = runAutoMigration;
