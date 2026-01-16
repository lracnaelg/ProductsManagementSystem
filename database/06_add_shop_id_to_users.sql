-- Add shop_id column to users table
-- Run this script to add shop_id column for linking users to shops

USE product_management;

-- Add shop_id column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS shop_id INT NULL,
ADD FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_shop_id ON users(shop_id);

-- Note: After running this, you'll need to:
-- 1. Update existing users to assign them to shops
-- 2. Or create new users with shop_id when creating shops

-- Example: Assign user to a shop
-- UPDATE users SET shop_id = 1 WHERE username = 'user';
