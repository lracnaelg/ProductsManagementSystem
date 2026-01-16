import express from 'express';
import { Sale, Product, ProductVariation, Shop } from '../models/index.js';
import { sequelize } from '../config/database.js';
import { authenticateToken, requireUser } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

router.use(authenticateToken);
router.use(requireUser);

// Middleware to validate shop access
const validateShopAccess = (req, res, next) => {
  const shopId = req.query.shopId || req.body.shop_id || req.params.shopId;
  
  if (req.user.role === 'admin') {
    return next();
  }
  
  if (!shopId) {
    return res.status(400).json({ message: 'Shop ID is required' });
  }
  
  if (req.user.shop_id && parseInt(req.user.shop_id) !== parseInt(shopId)) {
    return res.status(403).json({ message: 'Access denied: You do not have access to this shop' });
  }
  
  next();
};

// Get all sales
router.get('/', validateShopAccess, async (req, res) => {
  try {
    const { shopId, productId, startDate, endDate } = req.query;
    let where = {};

    if (shopId) where.shop_id = shopId;
    if (productId) where.product_id = productId;
    if (startDate || endDate) {
      where.sale_date = {};
      if (startDate) where.sale_date[Op.gte] = new Date(startDate);
      if (endDate) where.sale_date[Op.lte] = new Date(endDate);
    }

    const sales = await Sale.findAll({
      where,
      include: [
        { model: Shop, as: 'shop', attributes: ['id', 'name'] },
        { model: Product, as: 'product', attributes: ['id', 'name'] },
        { model: ProductVariation, as: 'variation', attributes: ['id', 'variation_type', 'variation_value'] }
      ],
      order: [['sale_date', 'DESC']]
    });

    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ message: 'Error fetching sales' });
  }
});

// Get single sale
router.get('/:id', async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        { model: Shop, as: 'shop' },
        { model: Product, as: 'product' },
        { model: ProductVariation, as: 'variation' }
      ]
    });

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Validate shop access
    if (req.user.role !== 'admin' && req.user.shop_id && parseInt(req.user.shop_id) !== parseInt(sale.shop_id)) {
      return res.status(403).json({ message: 'Access denied: You do not have access to this sale' });
    }

    res.json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ message: 'Error fetching sale' });
  }
});

// Create sale
router.post('/', validateShopAccess, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { shop_id, product_id, variation_id, quantity_sold, unit_price, sale_date } = req.body;

    if (!shop_id || !product_id || !quantity_sold || !unit_price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const total_amount = parseFloat(unit_price) * parseInt(quantity_sold);

    // Check stock availability
    if (variation_id) {
      const variation = await ProductVariation.findByPk(variation_id, { transaction });
      if (!variation || variation.stock < quantity_sold) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Insufficient stock for variation' });
      }
      await variation.update(
        { stock: variation.stock - quantity_sold },
        { transaction }
      );
    } else {
      const product = await Product.findByPk(product_id, { transaction });
      if (!product || product.stock < quantity_sold) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      await product.update(
        { stock: product.stock - quantity_sold },
        { transaction }
      );
    }

    const sale = await Sale.create({
      shop_id,
      product_id,
      variation_id,
      quantity_sold,
      unit_price,
      total_amount,
      sale_date: sale_date || new Date(),
      user_id: req.user.id
    }, { transaction });

    await transaction.commit();

    const saleWithRelations = await Sale.findByPk(sale.id, {
      include: [
        { model: Shop, as: 'shop' },
        { model: Product, as: 'product' },
        { model: ProductVariation, as: 'variation' }
      ]
    });

    res.status(201).json(saleWithRelations);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating sale:', error);
    res.status(500).json({ message: 'Error creating sale' });
  }
});

// Get sales statistics
router.get('/stats/summary', validateShopAccess, async (req, res) => {
  try {
    const { shopId, startDate, endDate } = req.query;
    let where = {};

    if (shopId) where.shop_id = shopId;
    if (startDate || endDate) {
      where.sale_date = {};
      if (startDate) where.sale_date[Op.gte] = new Date(startDate);
      if (endDate) where.sale_date[Op.lte] = new Date(endDate);
    }

    const stats = await Sale.findAll({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
        [sequelize.fn('SUM', sequelize.col('quantity_sold')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue']
      ]
    });

    res.json(stats[0] || { totalTransactions: 0, totalQuantity: 0, totalRevenue: 0 });
  } catch (error) {
    console.error('Error fetching sales stats:', error);
    res.status(500).json({ message: 'Error fetching sales stats' });
  }
});

// Delete sale (requires admin credentials)
router.delete('/:id', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { adminUsername, adminPassword } = req.body;
    
    // Verify admin credentials
    if (!adminUsername || !adminPassword) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Admin credentials are required to delete a sale' });
    }

    const { User } = await import('../models/index.js');
    const admin = await User.findOne({ 
      where: { username: adminUsername, role: 'admin' } 
    });

    if (!admin || !admin.active) {
      await transaction.rollback();
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const isValidPassword = await admin.comparePassword(adminPassword);
    if (!isValidPassword) {
      await transaction.rollback();
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Get the sale to delete
    const sale = await Sale.findByPk(req.params.id, { transaction });

    if (!sale) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Validate shop access (non-admin users can't delete sales from other shops)
    if (req.user.role !== 'admin' && req.user.shop_id && parseInt(req.user.shop_id) !== parseInt(sale.shop_id)) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Access denied: You do not have access to this sale' });
    }

    // Restore stock when deleting a sale
    if (sale.variation_id) {
      const variation = await ProductVariation.findByPk(sale.variation_id, { transaction });
      if (variation) {
        await variation.update(
          { stock: variation.stock + sale.quantity_sold },
          { transaction }
        );
      }
    } else {
      const product = await Product.findByPk(sale.product_id, { transaction });
      if (product) {
        await product.update(
          { stock: product.stock + sale.quantity_sold },
          { transaction }
        );
      }
    }

    // Delete the sale
    await sale.destroy({ transaction });

    await transaction.commit();
    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting sale:', error);
    res.status(500).json({ message: 'Error deleting sale' });
  }
});

export default router;
