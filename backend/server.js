import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './config/database.js';
import { seedAdmin } from './seeders/seedAdmin.js';
import authRoutes from './routes/auth.js';
import adminShopRoutes from './routes/admin/shops.js';
import adminUserRoutes from './routes/admin/users.js';
import shopRoutes from './routes/shops.js';
import productRoutes from './routes/products.js';
import supplierRoutes from './routes/suppliers.js';
import purchaseRoutes from './routes/purchases.js';
import saleRoutes from './routes/sales.js';
import financialRoutes from './routes/financial.js';
import exportRoutes from './routes/export.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded images
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/shops', adminShopRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Test database connection and sync models
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync database (creates tables if they don't exist)
    // In production, use migrations instead
    // Note: Using 'force: false' to prevent data loss
    // Using 'alter: false' to avoid index conflicts
    // If you need to modify schema, use migrations or SQL scripts
    try {
      await sequelize.sync({ alter: false, force: false });
      console.log('✅ Database synchronized.');
    } catch (syncError) {
      // Handle "too many keys" error gracefully - tables likely already have correct structure
      if (syncError.name === 'SequelizeDatabaseError' && 
          syncError.original?.code === 'ER_TOO_MANY_KEYS') {
        console.log('⚠️  Schema sync skipped (too many indexes - tables may already be correctly structured)');
        console.log('✅ Continuing with server startup...');
      } else {
        throw syncError;
      }
    }
    
    // Seed admin user
    await seedAdmin();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();
