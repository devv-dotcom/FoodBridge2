-- FoodBridge Database Patch V3: Full Advanced Features (1 to 13)
-- Safe, idempotent, non-destructive migration script
USE foodbridge;

SET @dbname = DATABASE();

-- 1. Safely add impact_points and badge_level to users table
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'impact_points') > 0,
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN impact_points INT UNSIGNED NOT NULL DEFAULT 0 AFTER is_verified;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'badge_level') > 0,
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN badge_level VARCHAR(50) NOT NULL DEFAULT \'Bronze Hero\' AFTER impact_points;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'latitude') > 0,
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN latitude DECIMAL(10,7) NULL AFTER pincode, ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Safely add is_emergency to donations table
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'donations' AND COLUMN_NAME = 'is_emergency') > 0,
  'SELECT 1',
  'ALTER TABLE donations ADD COLUMN is_emergency BOOLEAN NOT NULL DEFAULT FALSE AFTER status;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Safely add live tracking GPS coordinates to pickup_requests table
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'pickup_requests' AND COLUMN_NAME = 'current_latitude') > 0,
  'SELECT 1',
  'ALTER TABLE pickup_requests ADD COLUMN current_latitude DECIMAL(10,7) NULL AFTER delivery_notes, ADD COLUMN current_longitude DECIMAL(10,7) NULL AFTER current_latitude, ADD COLUMN last_location_updated_at DATETIME NULL AFTER current_longitude;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Allow system-generated notifications (created_by NULLable)
-- Remove foreign key constraint if it exists to allow NULL created_by
SET @fk_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'notifications' AND CONSTRAINT_NAME = 'fk_notifications_admin'
);
SET @preparedStatement = (SELECT IF(
  @fk_exists > 0,
  'ALTER TABLE notifications DROP FOREIGN KEY fk_notifications_admin, MODIFY COLUMN created_by BIGINT UNSIGNED NULL, ADD CONSTRAINT fk_notifications_admin FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL;',
  'ALTER TABLE notifications MODIFY COLUMN created_by BIGINT UNSIGNED NULL;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Create index for faster proximity & leaderboard queries
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_points') > 0,
  'SELECT 1',
  'ALTER TABLE users ADD KEY idx_users_points (impact_points DESC);'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
