-- ============================================================
--  Food Rescue · Account Data Reset Script
--  Wipes ALL user accounts and related data.
--  The database structure (tables, indexes, constraints) and
--  food_categories seed data are preserved.
--
--  Run with:
--    mysql -u <user> -p foodbridge < database/reset_accounts.sql
--  OR paste into MySQL Workbench / phpMyAdmin / DBeaver.
-- ============================================================

USE foodbridge;

-- Disable FK checks so we can truncate in any order
SET FOREIGN_KEY_CHECKS = 0;

-- ── Leaf / dependent tables first ────────────────────────────
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE analytics;
TRUNCATE TABLE delivery_proofs;
TRUNCATE TABLE pickup_history;
TRUNCATE TABLE pickup_requests;
TRUNCATE TABLE accepted_donations;
TRUNCATE TABLE donation_images;
TRUNCATE TABLE donations;
TRUNCATE TABLE ngo_profiles;
TRUNCATE TABLE ngos;
TRUNCATE TABLE volunteer_profiles;
TRUNCATE TABLE volunteers;
TRUNCATE TABLE business_profiles;
TRUNCATE TABLE reports;
TRUNCATE TABLE reviews;
TRUNCATE TABLE website_settings;
TRUNCATE TABLE contact_messages;
TRUNCATE TABLE notifications;
TRUNCATE TABLE admins;

-- ── Root table ───────────────────────────────────────────────
TRUNCATE TABLE users;

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

-- Confirm
SELECT 'All account data cleared successfully.' AS status;
