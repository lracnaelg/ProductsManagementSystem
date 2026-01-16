# Troubleshooting Guide

## 500 Internal Server Error on Login

If you're getting a 500 error when trying to login, check the following:

### Step 1: Check Backend Server is Running

1. Open terminal where backend is running
2. Look for these messages:
   ```
   ✅ Database connection established successfully.
   ✅ Database synchronized.
   ✅ Admin user created: username=admin, password=admin123
   ✅ Default user created: username=user, password=user123
   🚀 Server is running on port 5000
   ```

3. **If you don't see these messages:**
   - The backend server is not running
   - Start it: `cd backend && npm run dev`

### Step 2: Check .env File

Make sure `backend/.env` file exists and has:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=product_management
DB_USER=root
DB_PASSWORD=your_mysql_password

JWT_SECRET=your-secret-key-change-this-to-random-string
UPLOAD_DIR=./uploads
```

**Important:** 
- Replace `your_mysql_password` with your actual MySQL password
- Replace `your-secret-key-change-this-to-random-string` with any random string (e.g., `my-secret-key-123`)

### Step 3: Check Database Connection

1. Check if MySQL is running
2. Test database connection in DBeaver
3. Verify database `product_management` exists
4. Check backend console for database errors

### Step 4: Check Users Table Exists

In DBeaver, run:
```sql
USE product_management;
SELECT * FROM users;
```

**If table doesn't exist:**
- The backend didn't create tables
- Check backend console for errors
- Or run `database/02_create_tables.sql` manually

**If table exists but is empty:**
- Users weren't created
- Check backend console for seeder errors
- Manually create users (see below)

### Step 5: Manual User Creation (if needed)

If users weren't created automatically, you can create them manually:

**Option A: Restart Backend Server**
- Stop backend (Ctrl+C)
- Delete users table: `DROP TABLE IF EXISTS users;`
- Restart backend: `npm run dev`
- It will recreate users automatically

**Option B: Create Users via SQL**
```sql
USE product_management;

-- Note: These passwords need to be bcrypt hashed
-- It's better to let the application create them
-- But if needed, you can use this (password: admin123):
INSERT INTO users (username, password, email, role, active, createdAt, updatedAt)
VALUES (
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin@example.com',
  'admin',
  TRUE,
  NOW(),
  NOW()
);

-- User password: user123
INSERT INTO users (username, password, email, role, active, createdAt, updatedAt)
VALUES (
  'user',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'user@example.com',
  'user',
  TRUE,
  NOW(),
  NOW()
);
```

**⚠️ Warning:** The above SQL uses the same hash for both (not recommended). Let the application create users with proper hashing.

### Step 6: Check Backend Console for Errors

Look at your backend terminal for specific error messages:
- Database connection errors
- JWT_SECRET missing
- Model loading errors
- Seeder errors

### Step 7: Verify JWT_SECRET is Set

The error might be that JWT_SECRET is missing. Check:
```bash
cd backend
cat .env | grep JWT_SECRET
```

If empty, add:
```env
JWT_SECRET=any-random-string-here-12345
```

Then restart backend server.

## Common Issues

### Issue: "Cannot find module"
**Solution:** Run `npm install` in both backend and frontend folders

### Issue: "Port already in use"
**Solution:** 
- Change PORT in `.env` file
- Or kill process using port 5000

### Issue: "Access denied for user"
**Solution:**
- Check MySQL username/password in `.env`
- Verify MySQL user has permissions

### Issue: "Table doesn't exist"
**Solution:**
- Let backend create tables (restart server)
- Or run `database/02_create_tables.sql` manually

## Quick Fix Checklist

✅ Backend server running on port 5000  
✅ Frontend server running on port 3000  
✅ MySQL database running  
✅ `.env` file exists in backend folder  
✅ `JWT_SECRET` is set in `.env`  
✅ Database `product_management` exists  
✅ Users table exists  
✅ Users exist in database  
✅ No errors in backend console  

## Still Having Issues?

1. **Check backend console** - It will show specific errors
2. **Check browser console** - Look for detailed error messages
3. **Test API directly:**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status":"OK","message":"Server is running"}`

4. **Check database connection:**
   - Test in DBeaver
   - Verify credentials in `.env` match

Let me know what errors you see in the backend console and I can help further!
