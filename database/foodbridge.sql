-- FoodBridge master database setup
-- Run this file from the project root with the MySQL client, for example:
--   mysql -u root -p < database/foodbridge.sql
--
-- The module scripts remain in backend/database so they can also be run individually.

SOURCE backend/database/schema.sql;
SOURCE backend/database/business.sql;
SOURCE backend/database/donation_ngo.sql;
SOURCE backend/database/volunteer_pickup.sql;
SOURCE backend/database/admin_module.sql;
