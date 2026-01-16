import express from 'express';
import { Product, Shop, Supplier, ProductVariation } from '../models/index.js';
import { authenticateToken, requireUser, requireShopAccess } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

router.use(authenticateToken);
router.use(requireUser);

// Middleware to validate shop access for this router
const validateShopAccess = (req, res, next) => {
  const shopId = req.query.shopId || req.body.shop_id || req.params.shopId;
  
  // Admins can access any shop
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Regular users must belong to the shop they're trying to access
  if (!shopId) {
    return res.status(400).json({ message: 'Shop ID is required' });
  }
  
  if (req.user.shop_id && parseInt(req.user.shop_id) !== parseInt(shopId)) {
    return res.status(403).json({ message: 'Access denied: You do not have access to this shop' });
  }
  
  next();
};

// Get all products (filtered by shop, category, search)
router.get('/', validateShopAccess, async (req, res) => {
  try {
    const { shopId, category, search, status } = req.query;

    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    let where = { shop_id: shopId };

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const products = await Product.findAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
        { model: ProductVariation, as: 'variations' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Shop, as: 'shop' },
        { model: Supplier, as: 'supplier' },
        { model: ProductVariation, as: 'variations' }
      ]
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate shop access
    if (req.user.role !== 'admin' && req.user.shop_id && parseInt(req.user.shop_id) !== parseInt(product.shop_id)) {
      return res.status(403).json({ message: 'Access denied: You do not have access to this product' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Create product
router.post('/', validateShopAccess, async (req, res) => {
  try {
    const {
      shop_id,
      name,
      description,
      category,
      cost_price,
      selling_price,
      stock,
      low_stock_threshold,
      image_url,
      status,
      supplier_id,
      variations
    } = req.body;

    if (!shop_id || !name || cost_price === undefined || selling_price === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const product = await Product.create({
      shop_id,
      name,
      description,
      category,
      cost_price,
      selling_price,
      stock: stock || 0,
      low_stock_threshold: low_stock_threshold || 10,
      image_url,
      status: status || 'active',
      supplier_id
    });

    // Create variations if provided
    if (variations && variations.length > 0) {
      await Promise.all(
        variations.map(variation =>
          ProductVariation.create({
            product_id: product.id,
            ...variation
          })
        )
      );
    }

    const productWithRelations = await Product.findByPk(product.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: ProductVariation, as: 'variations' }
      ]
    });

    res.status(201).json(productWithRelations);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate shop access
    if (req.user.role !== 'admin' && req.user.shop_id && parseInt(req.user.shop_id) !== parseInt(product.shop_id)) {
      return res.status(403).json({ message: 'Access denied: You do not have access to this product' });
    }

    await product.update(req.body);

    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: ProductVariation, as: 'variations' }
      ]
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete product (requires admin credentials)
router.delete('/:id', async (req, res) => {
  try {
    const { adminUsername, adminPassword } = req.body;
    
    // Verify admin credentials
    if (!adminUsername || !adminPassword) {
      return res.status(400).json({ message: 'Admin credentials are required to delete a product' });
    }

    const { User } = await import('../models/index.js');
    const admin = await User.findOne({ 
      where: { username: adminUsername, role: 'admin' } 
    });

    if (!admin || !admin.active) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const isValidPassword = await admin.comparePassword(adminPassword);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Get the product to delete
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate shop access (non-admin users can't delete products from other shops)
    if (req.user.role !== 'admin' && req.user.shop_id && parseInt(req.user.shop_id) !== parseInt(product.shop_id)) {
      return res.status(403).json({ message: 'Access denied: You do not have access to this product' });
    }

    await product.destroy();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// Bulk update products
router.post('/bulk-update', validateShopAccess, async (req, res) => {
  try {
    const { productIds, updates } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Product IDs are required' });
    }

    await Product.update(updates, {
      where: { id: productIds }
    });

    res.json({ message: 'Products updated successfully' });
  } catch (error) {
    console.error('Error bulk updating products:', error);
    res.status(500).json({ message: 'Error bulk updating products' });
  }
});

export default router;
