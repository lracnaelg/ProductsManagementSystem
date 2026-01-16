-- Sample Data Script (Optional)
-- Add this data after setting up users and shops
-- This creates sample shops, suppliers, and products for testing

USE product_management;

-- Get admin user ID
SET @admin_id = (SELECT id FROM users WHERE username = 'admin' AND role = 'admin' LIMIT 1);

-- Insert Sample Shops (only if they don't exist)
INSERT INTO shops (name, description, category, created_by, createdAt, updatedAt)
VALUES 
    ('MotorShop', 'Motorcycle parts and accessories shop', 'MotorShop', @admin_id, NOW(), NOW()),
    ('VapeShop', 'Vaping products and accessories shop', 'VapeShop', @admin_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=name;

-- Get shop IDs
SET @motorshop_id = (SELECT id FROM shops WHERE name = 'MotorShop' LIMIT 1);
SET @vapeshop_id = (SELECT id FROM shops WHERE name = 'VapeShop' LIMIT 1);

-- Insert Sample Suppliers
INSERT INTO suppliers (name, contact_person, phone, email, address, createdAt, updatedAt)
VALUES 
    ('MotorParts Inc', 'John Smith', '+1234567890', 'contact@motorparts.com', '123 Motor St, City', NOW(), NOW()),
    ('VapeSupply Co', 'Jane Doe', '+0987654321', 'info@vapesupply.com', '456 Vape Ave, City', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=name;

-- Get supplier IDs
SET @motor_supplier_id = (SELECT id FROM suppliers WHERE name = 'MotorParts Inc' LIMIT 1);
SET @vape_supplier_id = (SELECT id FROM suppliers WHERE name = 'VapeSupply Co' LIMIT 1);

-- Insert Sample Products for MotorShop
INSERT INTO products (shop_id, name, description, category, cost_price, selling_price, stock, low_stock_threshold, supplier_id, status, createdAt, updatedAt)
VALUES 
    (@motorshop_id, 'Engine Oil 1L', 'High-quality engine oil for motorcycles', 'Lubricants', 10.00, 18.00, 50, 10, @motor_supplier_id, 'active', NOW(), NOW()),
    (@motorshop_id, 'Brake Pad Set', 'Front brake pad set for sports bikes', 'Brakes', 25.00, 45.00, 30, 5, @motor_supplier_id, 'active', NOW(), NOW()),
    (@motorshop_id, 'Helmet Full Face', 'Premium full face helmet with visor', 'Safety', 50.00, 120.00, 20, 5, @motor_supplier_id, 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=name;

-- Insert Sample Products for VapeShop
INSERT INTO products (shop_id, name, description, category, cost_price, selling_price, stock, low_stock_threshold, supplier_id, status, createdAt, updatedAt)
VALUES 
    (@vapeshop_id, 'Vape Pod System', 'Starter vape pod system kit', 'Starter Kits', 15.00, 35.00, 40, 10, @vape_supplier_id, 'active', NOW(), NOW()),
    (@vapeshop_id, 'E-Liquid 30ml', 'Premium e-liquid in various flavors', 'E-Liquid', 8.00, 20.00, 100, 20, @vape_supplier_id, 'active', NOW(), NOW()),
    (@vapeshop_id, 'Replacement Coils', 'Pack of 5 replacement coils', 'Accessories', 5.00, 15.00, 60, 15, @vape_supplier_id, 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=name;

-- Note: Run this script only after the application has created the admin user
-- Or manually adjust the @admin_id variable if needed
