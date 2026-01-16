import express from 'express';
import { Purchase, PurchaseItem, Product, Shop, Supplier } from '../models/index.js';
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

// Get all purchases
router.get('/', validateShopAccess, async (req, res) => {
  try {
    const { shopId, supplierId, startDate, endDate } = req.query;
    let where = {};

    if (shopId) where.shop_id = shopId;
    if (supplierId) where.supplier_id = supplierId;
    if (startDate || endDate) {
      where.purchase_date = {};
      if (startDate) where.purchase_date[Op.gte] = new Date(startDate);
      if (endDate) where.purchase_date[Op.lte] = new Date(endDate);
    }

    const purchases = await Purchase.findAll({
      where,
      include: [
        { model: Shop, as: 'shop', attributes: ['id', 'name'] },
        { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
        {
          model: PurchaseItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }]
        }
      ],
      order: [['purchase_date', 'DESC']]
    });

    res.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: 'Error fetching purchases' });
  }
});

// Get single purchase
router.get('/:id', async (req, res) => {
  try {
    const purchase = await Purchase.findByPk(req.params.id, {
      include: [
        { model: Shop, as: 'shop' },
        { model: Supplier, as: 'supplier' },
        {
          model: PurchaseItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    // Validate shop access
    if (req.user.role !== 'admin' && req.user.shop_id && parseInt(req.user.shop_id) !== parseInt(purchase.shop_id)) {
      return res.status(403).json({ message: 'Access denied: You do not have access to this purchase' });
    }

    res.json(purchase);
  } catch (error) {
    console.error('Error fetching purchase:', error);
    res.status(500).json({ message: 'Error fetching purchase' });
  }
});

// Create purchase
router.post('/', validateShopAccess, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { shop_id, supplier_id, items, shipping_cost, fees, purchase_date, notes } = req.body;

    if (!shop_id || !supplier_id || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Calculate total cost
    let itemsTotal = 0;
    items.forEach(item => {
      itemsTotal += parseFloat(item.unit_cost) * parseInt(item.quantity);
    });

    const total_cost = itemsTotal + parseFloat(shipping_cost || 0) + parseFloat(fees || 0);

    const purchase = await Purchase.create({
      shop_id,
      supplier_id,
      total_cost,
      shipping_cost: shipping_cost || 0,
      fees: fees || 0,
      purchase_date: purchase_date || new Date(),
      notes
    }, { transaction });

    // Create purchase items and update/create product stock
    for (const item of items) {
      const unitCost = parseFloat(item.unit_cost);
      const quantity = parseInt(item.quantity);
      const itemTotal = unitCost * quantity;

      let product;
      
      // If product_id is provided, use existing product
      if (item.product_id) {
        product = await Product.findByPk(item.product_id, { transaction });
      }
      
      // If product doesn't exist but product info is provided, create new product
      if (!product && item.product_name) {
        // Check if product with same name already exists in this shop
        const existingProduct = await Product.findOne({
          where: {
            shop_id: shop_id,
            name: item.product_name
          },
          transaction
        });

        if (existingProduct) {
          product = existingProduct;
        } else {
          // Create new product
          product = await Product.create({
            shop_id: shop_id,
            name: item.product_name,
            description: item.product_description || '',
            category: item.product_category || '',
            cost_price: unitCost,
            selling_price: parseFloat(item.product_selling_price) || unitCost * 1.5, // Default 50% markup
            stock: 0, // Will be updated below
            low_stock_threshold: 10,
            status: 'active',
            supplier_id: supplier_id
          }, { transaction });
        }
      }

      if (!product) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Product information is required for each item' });
      }

      await PurchaseItem.create({
        purchase_id: purchase.id,
        product_id: product.id,
        quantity,
        unit_cost: unitCost,
        total_cost: itemTotal
      }, { transaction });

      // Update product stock and cost price
      // Calculate new average cost price
      const currentStock = product.stock || 0;
      const currentTotalCost = parseFloat(product.cost_price) * currentStock;
      const newTotalCost = currentTotalCost + itemTotal;
      const newStock = currentStock + quantity;
      const newCostPrice = newStock > 0 ? newTotalCost / newStock : unitCost;

      // Update product with new stock and cost price
      // Also update selling price if provided for new products
      const updateData = {
        stock: newStock,
        cost_price: newCostPrice.toFixed(2)
      };

      // If this is a new product and selling price was provided, update it
      if (item.product_selling_price && (!item.product_id || product.selling_price === 0)) {
        updateData.selling_price = parseFloat(item.product_selling_price);
      }

      await product.update(updateData, { transaction });
    }

    await transaction.commit();

    const purchaseWithRelations = await Purchase.findByPk(purchase.id, {
      include: [
        { model: Shop, as: 'shop' },
        { model: Supplier, as: 'supplier' },
        {
          model: PurchaseItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });

    res.status(201).json(purchaseWithRelations);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating purchase:', error);
    res.status(500).json({ message: 'Error creating purchase' });
  }
});

export default router;
