# Setup Guide - Step by Step

Follow these steps to get your Product Management System running.

## ✅ Step 1: Database Setup

### Option A: Using DBeaver (Manual)

1. Open DBeaver and connect to your MySQL server
2. Run the SQL scripts in order:
   - `database/01_create_database.sql` - Creates the database
   - `database/02_create_tables.sql` - Creates all tables
   - (Optional) `database/05_sample_data.sql` - Adds sample data

### Option B: Automatic (Recommended)

1. In DBeaver or MySQL client, just create the database:
   ```sql
   CREATE DATABASE product_management;
   ```
2. The backend will create all tables automatically when it starts

---

## ✅ Step 2: Backend Configuration

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Create `.env` file** in the `backend` folder:
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
   ⚠️ Replace `your_mysql_password` with your actual MySQL password
   ⚠️ Replace `your-secret-key-change-this-to-random-string` with a random string

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Create uploads folder** (for product images):
   ```bash
   mkdir uploads
   ```

5. **Start the backend server:**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   ✅ Database connection established successfully.
   ✅ Database synchronized.
   ✅ Admin user created: username=admin, password=admin123
   ✅ Default user created: username=user, password=user123
   🚀 Server is running on port 5000
   ```

6. **Test the backend:**
   - Open browser: http://localhost:5000/api/health
   - Should return: `{"status":"OK","message":"Server is running"}`

---

## ✅ Step 3: Frontend Setup

1. **Open a NEW terminal window** (keep backend running)

2. **Navigate to frontend folder:**
   ```bash
   cd frontend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the frontend server:**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   VITE v5.x.x ready in xxx ms
   ➜  Local:   http://localhost:3000/
   ```

---

## ✅ Step 4: Test the Application

1. **Open browser:** http://localhost:3000

2. **Test Admin Login:**
   - Click "Admin Login"
   - Username: `admin`
   - Password: `admin123`
   - Should redirect to Admin Dashboard

3. **Create a Shop:**
   - Click "Manage Shops"
   - Click "+ Add New Shop"
   - Fill in details:
     - Name: `MotorShop`
     - Category: `MotorShop`
     - Description: (optional)
   - Click "Create"

4. **Test User Login:**
   - Logout from admin
   - Click "User Login"
   - Username: `user`
   - Password: `user123`
   - Should see shop selection screen
   - Click on the shop you created

5. **View Dashboard:**
   - Should see dashboard with metrics (all zeros initially)

---

## ✅ Step 5: Verify Everything Works

✅ Backend running on port 5000  
✅ Frontend running on port 3000  
✅ Database connected  
✅ Can login as admin  
✅ Can create shops  
✅ Can login as user  
✅ Can select shop  
✅ Dashboard loads  

---

## 🚀 Next Development Steps

Now that the system is running, we can implement the remaining UI pages:

1. **Product Management Page** - Add, edit, delete products with images and variations
2. **Supplier Management Page** - Manage suppliers
3. **Purchase/Restocking Page** - Record purchases
4. **Sales Management Page** - Record sales
5. **Financial Analytics Page** - Charts and reports

All the backend APIs are ready, so implementing these pages is straightforward.

---

## 🐛 Troubleshooting

### Database Connection Error
- Check MySQL is running
- Verify `.env` file has correct credentials
- Check database name matches

### Port Already in Use
- Change PORT in `.env` file
- Or stop other services using port 5000

### Module Not Found
- Delete `node_modules` folder
- Run `npm install` again

### Tables Not Created
- Check database connection
- Look for errors in console
- Try running `database/02_create_tables.sql` manually in DBeaver

---

## 📝 Default Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`

**User:**
- Username: `user`
- Password: `user123`

⚠️ **Change these passwords in production!**

---

Ready to continue? Let me know when you've completed these steps and we can start building the remaining features!
