-- Food Rescue Database Patch V5: Unified Food Rescue Partner System & OTP Verification
USE foodbridge;

-- 1. Partner Profiles Table (Stores parameters for both NGO & Volunteer partners)
CREATE TABLE IF NOT EXISTS partner_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  transport_type VARCHAR(60) NOT NULL DEFAULT 'car',
  capacity_kg INT UNSIGNED NOT NULL DEFAULT 50,
  service_radius_km DECIMAL(6,2) NOT NULL DEFAULT 15.00,
  availability ENUM('online', 'offline', 'busy') NOT NULL DEFAULT 'online',
  trust_score INT UNSIGNED NOT NULL DEFAULT 95,
  hours_contributed INT UNSIGNED NOT NULL DEFAULT 0,
  organization_capacity VARCHAR(255) NULL,
  emergency_contact VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_partner_profiles_user (user_id),
  CONSTRAINT fk_partner_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 2. Ensure OTP and workflow fields exist on assignments table
SET @dbname = DATABASE();
SET @tablename = 'assignments';

-- Add pickup_otp_hash column safely
SET @preparedStatement1 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'pickup_otp_hash') > 0,
  'SELECT 1',
  'ALTER TABLE assignments ADD COLUMN pickup_otp_hash VARCHAR(255) NULL AFTER status;'
));
PREPARE stmt1 FROM @preparedStatement1; EXECUTE stmt1; DEALLOCATE PREPARE stmt1;

-- Add delivery_otp_hash column safely
SET @preparedStatement2 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'delivery_otp_hash') > 0,
  'SELECT 1',
  'ALTER TABLE assignments ADD COLUMN delivery_otp_hash VARCHAR(255) NULL AFTER pickup_otp_hash;'
));
PREPARE stmt2 FROM @preparedStatement2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- Add arrived_at_pickup_at column safely
SET @preparedStatement3 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'arrived_at_pickup_at') > 0,
  'SELECT 1',
  'ALTER TABLE assignments ADD COLUMN arrived_at_pickup_at DATETIME NULL AFTER pickup_confirmed_at;'
));
PREPARE stmt3 FROM @preparedStatement3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

-- Add arrived_at_destination_at column safely
SET @preparedStatement4 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'arrived_at_destination_at') > 0,
  'SELECT 1',
  'ALTER TABLE assignments ADD COLUMN arrived_at_destination_at DATETIME NULL AFTER delivery_confirmed_at;'
));
PREPARE stmt4 FROM @preparedStatement4; EXECUTE stmt4; DEALLOCATE PREPARE stmt4;

-- The partner controller records both arrival milestones. Extend the existing
-- workflow enum without changing any persisted status values.
ALTER TABLE assignments MODIFY COLUMN status ENUM(
  'AVAILABLE', 'ACCEPTED', 'ASSIGNED', 'GOING_TO_PICKUP', 'ARRIVED_AT_PICKUP',
  'FOOD_COLLECTED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'ARRIVED_AT_DESTINATION',
  'DELIVERED', 'COMPLETED', 'CANCELLED'
) NOT NULL DEFAULT 'ACCEPTED';

-- 3. Predefined Destinations Table (Optional predefined distribution points)
CREATE TABLE IF NOT EXISTS predefined_destinations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  contact_person VARCHAR(100) NULL,
  contact_phone VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;
