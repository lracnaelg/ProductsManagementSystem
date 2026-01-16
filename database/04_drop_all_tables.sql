-- Drop All Tables Script
-- WARNING: This will delete all data!
-- Use this script only if you want to completely reset the database
-- Run this before running the create tables script if you need to start fresh

USE product_management;

-- Drop tables in reverse order of dependencies
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS purchase_items;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS product_variations;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS shops;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;
