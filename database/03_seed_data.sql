-- Seed Data Script
-- Run this to populate initial data
-- 
-- IMPORTANT: This script does NOT create users with passwords.
-- The application (backend server) will automatically create default users
-- with properly hashed bcrypt passwords when it first runs.
--
-- Default credentials (created by application):
-- Admin: username='admin', password='admin123'
-- User: username='user', password='user123'
--
-- If you want to manually create users, you need to hash passwords with bcrypt first.
-- The application's seeder (seeders/seedAdmin.js) will handle this automatically.

USE product_management;

-- This script is mainly for reference
-- The application will handle user creation with proper password hashing

-- If you need to manually create users, use this (with properly hashed passwords):
-- INSERT INTO users (username, password, email, role, active, createdAt, updatedAt)
-- VALUES 
-- ('admin', '$2a$10$YOUR_BCRYPT_HASHED_PASSWORD_HERE', 'admin@example.com', 'admin', TRUE, NOW(), NOW()),
-- ('user', '$2a$10$YOUR_BCRYPT_HASHED_PASSWORD_HERE', 'user@example.com', 'user', TRUE, NOW(), NOW())
-- ON DUPLICATE KEY UPDATE username=username;

-- Optional: Insert Sample Shops (if admin user exists)
-- Uncomment the following after the admin user is created:

/*
INSERT INTO shops (name, description, category, created_by, createdAt, updatedAt)
SELECT 
    'MotorShop',
    'Motorcycle parts and accessories shop',
    'MotorShop',
    id,
    NOW(),
    NOW()
FROM users WHERE username = 'admin' AND role = 'admin'
LIMIT 1
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO shops (name, description, category, created_by, createdAt, updatedAt)
SELECT 
    'VapeShop',
    'Vaping products and accessories shop',
    'VapeShop',
    id,
    NOW(),
    NOW()
FROM users WHERE username = 'admin' AND role = 'admin'
LIMIT 1
ON DUPLICATE KEY UPDATE name=name;
*/
