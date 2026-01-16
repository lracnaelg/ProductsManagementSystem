# Product Management System

A comprehensive full-stack product management system built with React, Node.js, Express, and MySQL.

## Features

- **Dual Authentication**: Separate admin and user login systems
- **Shop Management**: Admin can create, edit, and delete shops
- **Product Management**: Full CRUD operations with variations, images, and bulk operations
- **Supplier Management**: Track suppliers and compare prices
- **Purchase/Restocking**: Record purchases with automatic stock updates
- **Sales Management**: Record sales with automatic calculations
- **Financial Analytics**: Revenue/profit trends, margins, and dashboards
- **Data Export**: Export products, sales, and purchases to CSV

## Tech Stack

- **Frontend**: React 18, Vite, React Router
- **Backend**: Node.js, Express
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT tokens

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MySQL database (local or cloud-hosted)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=product_management
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=your-secret-key-change-this-in-production
UPLOAD_DIR=./uploads
```

4. Make sure MySQL is running and create the database:
```sql
CREATE DATABASE product_management;
```

5. Start the backend server:
```bash
npm run dev
```

The server will automatically:
- Create all database tables
- Seed an admin user (username: `admin`, password: `admin123`)
- Seed a default user (username: `user`, password: `user123`)

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:3000

## Default Credentials

**Admin Login:**
- Username: `admin`
- Password: `admin123`

**User Login:**
- Username: `user`
- Password: `user123`

⚠️ **Important**: Change these default passwords in production!

## Project Structure

```
Products Management System/
├── backend/
│   ├── config/          # Database configuration
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── seeders/         # Database seeders
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service functions
│   │   └── App.jsx      # Main app component
│   └── vite.config.js   # Vite configuration
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify token

### Admin Shops
- `GET /api/admin/shops` - Get all shops (admin)
- `POST /api/admin/shops` - Create shop
- `PUT /api/admin/shops/:id` - Update shop
- `DELETE /api/admin/shops/:id` - Delete shop

### Shops (Users)
- `GET /api/shops` - Get selectable shops
- `GET /api/shops/:id` - Get shop details

### Products
- `GET /api/products?shopId=:id` - Get products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/bulk-update` - Bulk update

### Suppliers, Purchases, Sales, Financial, Export
See the routes files for complete API documentation.

## Next Steps

The core system is set up with:
- ✅ Authentication system
- ✅ Database models and relationships
- ✅ Admin shop management
- ✅ Shop selection for users
- ✅ Basic dashboard

Still to be implemented (UI pages with full functionality):
- Product management UI
- Supplier management UI
- Purchase/restocking UI
- Sales management UI
- Financial analytics with charts
- Data export UI

## License

MIT
