# Important Update: Users Now Belong to Shops

## What Changed

Users are now linked to specific shops. The login flow has changed:

**Old Flow:**
1. User login → Select shop

**New Flow:**
1. Select shop → User login (for that specific shop)

## Database Migration

If you already have a database set up, run this script:

```sql
-- Add shop_id to users table
ALTER TABLE users 
ADD COLUMN shop_id INT NULL,
ADD FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL;

CREATE INDEX idx_users_shop_id ON users(shop_id);
```

Or run: `database/06_add_shop_id_to_users.sql`

## Creating Users for Shops

Users must now be assigned to a shop when created. You can:

### Option 1: Let Admin Create Users (Recommended)
- Admin creates shops first
- Then creates users and assigns them to shops
- (This feature will be added to admin panel)

### Option 2: Manual SQL
```sql
-- Create a user for a specific shop
INSERT INTO users (username, password, email, role, shop_id, active, createdAt, updatedAt)
VALUES (
  'shop1_user',
  'password123',  -- Will be hashed by application
  'user@shop1.com',
  'user',
  1,  -- shop_id
  TRUE,
  NOW(),
  NOW()
);
```

### Option 3: Use Application Seeder
The application will create users when shops are created (if configured).

## Testing

1. **Create a shop** (as admin)
2. **Create a user for that shop** (manually or via admin panel)
3. **Test login:**
   - Go to User Login
   - Select the shop
   - Enter user credentials for that shop

## Default Users

The default `user` account will NOT work anymore until assigned to a shop. You need to:

1. Create shops first (as admin)
2. Assign users to shops
3. Or create new users for each shop

## Questions?

If you need help creating users for shops, the admin panel will have this feature soon, or you can manually create users in the database.
