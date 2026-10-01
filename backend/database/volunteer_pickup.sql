-- Food Rescue Modules 6 and 7: run after schema.sql and donation_ngo.sql.
USE foodbridge;

CREATE TABLE IF NOT EXISTS volunteers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  vehicle_type VARCHAR(60) NOT NULL,
  driving_license_number VARCHAR(100) NULL,
  availability ENUM('online', 'offline', 'busy') NOT NULL DEFAULT 'offline',
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  completed_deliveries INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_volunteers_user (user_id),
  UNIQUE KEY uq_volunteers_license (driving_license_number),
  KEY idx_volunteers_availability (availability),
  CONSTRAINT chk_volunteer_rating CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT fk_volunteers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS volunteer_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  volunteer_id BIGINT UNSIGNED NOT NULL,
  profile_image VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_volunteer_profiles_volunteer (volunteer_id),
  CONSTRAINT fk_volunteer_profiles_volunteer FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pickup_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  donation_id BIGINT UNSIGNED NOT NULL,
  volunteer_id BIGINT UNSIGNED NULL,
  ngo_id BIGINT UNSIGNED NOT NULL,
  business_id BIGINT UNSIGNED NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  delivery_time DATETIME NULL,
  pickup_address VARCHAR(255) NOT NULL,
  delivery_address VARCHAR(255) NOT NULL,
  distance_km DECIMAL(8,2) NULL,
  status ENUM('pending', 'volunteer_assigned', 'pickup_started', 'food_collected', 'on_the_way', 'delivered', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  delivery_notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pickup_requests_donation (donation_id),
  KEY idx_pickup_requests_available (status, volunteer_id, pickup_date),
  KEY idx_pickup_requests_volunteer_status (volunteer_id, status, pickup_date),
  KEY idx_pickup_requests_ngo (ngo_id),
  KEY idx_pickup_requests_business (business_id),
  CONSTRAINT chk_pickup_distance CHECK (distance_km IS NULL OR distance_km >= 0),
  CONSTRAINT fk_pickup_requests_donation FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  CONSTRAINT fk_pickup_requests_volunteer FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE SET NULL,
  CONSTRAINT fk_pickup_requests_ngo FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pickup_requests_business FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS delivery_proofs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  pickup_id BIGINT UNSIGNED NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  notes VARCHAR(1000) NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_delivery_proofs_pickup (pickup_id),
  CONSTRAINT fk_delivery_proofs_pickup FOREIGN KEY (pickup_id) REFERENCES pickup_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pickup_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  pickup_id BIGINT UNSIGNED NOT NULL,
  donation_id BIGINT UNSIGNED NOT NULL,
  volunteer_id BIGINT UNSIGNED NOT NULL,
  ngo_id BIGINT UNSIGNED NOT NULL,
  business_id BIGINT UNSIGNED NOT NULL,
  status ENUM('completed', 'cancelled') NOT NULL,
  completed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pickup_history_pickup (pickup_id),
  KEY idx_pickup_history_volunteer_completed (volunteer_id, completed_at),
  KEY idx_pickup_history_ngo (ngo_id),
  CONSTRAINT fk_pickup_history_pickup FOREIGN KEY (pickup_id) REFERENCES pickup_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_pickup_history_donation FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pickup_history_volunteer FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pickup_history_ngo FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pickup_history_business FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
