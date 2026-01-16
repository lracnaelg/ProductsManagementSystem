# Database Setup Scripts

This folder contains SQL scripts for setting up the Product Management System database in DBeaver or any MySQL client.

## Scripts Order

Run the scripts in this order:

### 1. Create Database
**File:** `01_create_database.sql`
- Creates the `product_management` database
- Sets UTF-8 encoding

### 2. Create Tables
**File:** `02_create_tables.sql`
- Creates all required tables with relationships
- Sets up foreign keys and indexes
- Adds constraints and checks

### 3. Seed Initial Data
**File:** `03_seed_data.sql`
- Creates default admin and user accounts
- **Note:** The application will automatically create users with proper bcrypt hashed passwords when you first run it
- Optional sample shops (commented out)

### 4. Drop All Tables (Optional)
**File:** `04_drop_all_tables.sql`
- ⚠️ **WARNING:** This will delete ALL data!
- Use only if you want to completely reset the database

## How to Use in DBeaver

1. **Open DBeaver** and connect to your MySQL server

2. **Run Script 1:**
   - Open `01_create_database.sql`
   - Execute the script (Ctrl+Enter or click Execute)
   - This creates the database

3. **Run Script 2:**
   - Open `02_create_tables.sql`
   - Execute the script
   - This creates all tables

4. **Run Script 3 (Optional):**
   - Open `03_seed_data.sql`
   - Execute the script
   - **Note:** User passwords will be properly hashed by the application when it runs

5. **Start the Application:**
   - When you start the backend server, Sequelize will automatically:
     - Verify the tables exist
     - Create any missing tables
     - Seed the admin and user accounts with properly hashed passwords

## Alternative: Let Sequelize Handle Everything

If you prefer, you can skip running these SQL scripts and let Sequelize create everything automatically:

1. Just create an empty database:
   ```sql
   CREATE DATABASE product_management;
   ```

2. Update your `.env` file with database credentials

3. Start the backend server - it will create all tables automatically

## Default Credentials

After running the application for the first time, you can login with:

**Admin:**
- Username: `admin`
- Password: `admin123`

**User:**
- Username: `user`
- Password: `user123`

⚠️ **Important:** Change these default passwords in production!

## Database Structure

- **users** - Admin and regular users
- **shops** - Shop/store information
- **products** - Product details
- **product_variations** - Product variations (size, color, etc.)
- **suppliers** - Supplier information
- **purchases** - Purchase/restocking records
- **purchase_items** - Items in each purchase
- **sales** - Sales transactions
- **expenses** - Business expenses

## Troubleshooting

If you get foreign key constraint errors:
- Make sure you run scripts in order
- Check that foreign key checks are enabled: `SET FOREIGN_KEY_CHECKS = 1;`

If tables already exist:
- Use `04_drop_all_tables.sql` to remove them first
- Or modify scripts to use `CREATE TABLE IF NOT EXISTS`
