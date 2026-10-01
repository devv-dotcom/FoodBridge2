-- Food Rescue Database Patch V4: NGO & Volunteer Unified Workflow Tables
USE foodbridge;

-- 1. Unified Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  donation_id BIGINT UNSIGNED NOT NULL,
  member_id BIGINT UNSIGNED NOT NULL, -- Belongs to user (NGO or Volunteer)
  assigned_by BIGINT UNSIGNED NULL,
  pickup_time DATETIME NULL,
  delivery_time DATETIME NULL,
  status ENUM(
    'AVAILABLE',
    'ACCEPTED',
    'ASSIGNED',
    'GOING_TO_PICKUP',
    'FOOD_COLLECTED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED'
  ) NOT NULL DEFAULT 'ACCEPTED',
  pickup_confirmed_at DATETIME NULL,
  delivery_confirmed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_assignments_member (member_id, status),
  KEY idx_assignments_donation (donation_id),
  CONSTRAINT fk_assignments_donation FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignments_member FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 2. Proof Uploads Table (Pickup & Delivery Photo Proofs)
CREATE TABLE IF NOT EXISTS proofs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  assignment_id BIGINT UNSIGNED NOT NULL,
  uploaded_by BIGINT UNSIGNED NOT NULL,
  type ENUM('PICKUP', 'DELIVERY') NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_proofs_assignment (assignment_id, type),
  CONSTRAINT fk_proofs_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  CONSTRAINT fk_proofs_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Impact & Activity Tracker Table
CREATE TABLE IF NOT EXISTS impact_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  donation_id BIGINT UNSIGNED NULL,
  assignment_id BIGINT UNSIGNED NULL,
  food_quantity INT UNSIGNED NOT NULL DEFAULT 1,
  action VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_impact_user (user_id, created_at),
  CONSTRAINT fk_impact_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
