# .env File Setup Guide

## Location
Create a file named `.env` in the `backend` folder.

## Complete .env File Content

Copy this and fill in your values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=product_management
DB_USER=root
DB_PASSWORD=your_mysql_password_here

# JWT Secret Key (for authentication)
JWT_SECRET=mySecretKey123!@#changeThis

# File Upload Directory
UPLOAD_DIR=./uploads
```

## How to Fill Each Value

### PORT (Server Port)
- **What it is:** The port number where your backend server will run
- **Default:** `5000`
- **Change if:** Port 5000 is already in use

### NODE_ENV (Environment)
- **What it is:** Development or production mode
- **Value:** `development` (for development/testing)
- **Don't change** unless deploying to production

### DB_HOST (Database Host)
- **What it is:** Where your MySQL database is located
- **Value:** `localhost` (if MySQL is on your computer)
- **Change if:** Using a remote database (e.g., `db.example.com`)

### DB_PORT (Database Port)
- **What it is:** MySQL server port
- **Default:** `3306`
- **Change if:** Your MySQL uses a different port

### DB_NAME (Database Name)
- **What it is:** Name of your database
- **Value:** `product_management`
- **Change if:** You want a different database name

### DB_USER (Database Username)
- **What it is:** Your MySQL username
- **Common values:** `root` (default)
- **Change if:** You have a different MySQL user

### DB_PASSWORD (Database Password)
- **What it is:** Your MySQL password
- **⚠️ IMPORTANT:** Replace `your_mysql_password_here` with your actual MySQL password
- **Example:** If your MySQL password is `mypass123`, put: `DB_PASSWORD=mypass123`
- **If no password:** Leave empty: `DB_PASSWORD=`

### JWT_SECRET (Authentication Secret)
- **What it is:** Secret key for encrypting authentication tokens
- **⚠️ IMPORTANT:** Replace with any random string
- **Example values:**
  - `mySecretKey123!@#`
  - `super-secret-key-2024`
  - `aBc123!@#$%^&*()`
- **For production:** Use a long, random, secure string

### UPLOAD_DIR (Upload Directory)
- **What it is:** Folder where product images will be saved
- **Default:** `./uploads`
- **Don't change** unless you need a different location

## Example .env File

Here's a complete example (replace with your actual values):

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=product_management
DB_USER=root
DB_PASSWORD=mypassword123

JWT_SECRET=mySuperSecretKey123!@#

UPLOAD_DIR=./uploads
```

## Steps to Create .env File

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Create the file:**
   - Windows: Create a new file named `.env` (make sure it's not `.env.txt`)
   - Or copy `backend/.env.example` and rename to `.env`

3. **Open .env file** in a text editor

4. **Copy the template above** and fill in your MySQL password and JWT_SECRET

5. **Save the file**

## Quick Setup (Copy-Paste Ready)

**If MySQL password is empty:**
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=product_management
DB_USER=root
DB_PASSWORD=
JWT_SECRET=mySecretKey123!@#
UPLOAD_DIR=./uploads
```

**If MySQL has a password (replace `yourpassword`):**
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=product_management
DB_USER=root
DB_PASSWORD=yourpassword
JWT_SECRET=mySecretKey123!@#
UPLOAD_DIR=./uploads
```

## Common Mistakes to Avoid

❌ **Don't use quotes:**
```env
DB_PASSWORD="mypassword"  # Wrong!
DB_PASSWORD=mypassword    # Correct
```

❌ **Don't add spaces around =:**
```env
DB_PASSWORD = mypassword  # Wrong!
DB_PASSWORD=mypassword    # Correct
```

❌ **Don't commit .env to git:**
- The `.gitignore` file should already exclude `.env`
- Never share your `.env` file publicly

## Testing Your .env File

After creating `.env`, start the backend:

```bash
cd backend
npm run dev
```

You should see:
```
✅ Database connection established successfully.
✅ Database synchronized.
🚀 Server is running on port 5000
```

If you see database connection errors, check:
- MySQL is running
- DB_PASSWORD is correct
- DB_NAME exists (or let the app create it)

## Need Help?

If you're not sure about your MySQL password:
1. Open MySQL Workbench or DBeaver
2. Try to connect with your credentials
3. Use the same username/password in `.env`

If you forgot your MySQL root password, you may need to reset it or check your MySQL installation documentation.
