import express from 'express';
import { Shop, Product, Sale, Purchase } from '../../models/index.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Get all shops with stats
router.get('/', async (req, res) => {
  try {
    const shops = await Shop.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id']
        }
      ]
    });

    // Get stats for each shop
    const shopsWithStats = await Promise.all(
      shops.map(async (shop) => {
        const productCount = await Product.count({ where: { shop_id: shop.id } });
        const saleCount = await Sale.count({ where: { shop_id: shop.id } });
        const purchaseCount = await Purchase.count({ where: { shop_id: shop.id } });

        return {
          id: shop.id,
          name: shop.name,
          description: shop.description,
          category: shop.category,
          productCount,
          saleCount,
          purchaseCount,
          createdAt: shop.createdAt,
          updatedAt: shop.updatedAt
        };
      })
    );

    res.json(shopsWithStats);
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ message: 'Error fetching shops' });
  }
});

// Get single shop
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findByPk(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    console.error('Error fetching shop:', error);
    res.status(500).json({ message: 'Error fetching shop' });
  }
});

// Create shop
router.post('/', async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Shop name is required' });
    }

    // Check for duplicate name
    const existingShop = await Shop.findOne({ where: { name } });
    if (existingShop) {
      return res.status(400).json({ message: 'Shop name already exists' });
    }

    const shop = await Shop.create({
      name,
      description,
      category,
      created_by: req.user.id
    });

    res.status(201).json(shop);
  } catch (error) {
    console.error('Error creating shop:', error);
    res.status(500).json({ message: 'Error creating shop' });
  }
});

// Update shop
router.put('/:id', async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const shop = await Shop.findByPk(req.params.id);

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Check for duplicate name if name is being changed
    if (name && name !== shop.name) {
      const existingShop = await Shop.findOne({ where: { name } });
      if (existingShop) {
        return res.status(400).json({ message: 'Shop name already exists' });
      }
    }

    await shop.update({ name, description, category });
    res.json(shop);
  } catch (error) {
    console.error('Error updating shop:', error);
    res.status(500).json({ message: 'Error updating shop' });
  }
});

// Delete shop
router.delete('/:id', async (req, res) => {
  try {
    const shop = await Shop.findByPk(req.params.id);

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Check if shop has products
    const productCount = await Product.count({ where: { shop_id: shop.id } });
    
    if (productCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete shop. It has ${productCount} product(s) associated with it.` 
      });
    }

    await shop.destroy();
    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    console.error('Error deleting shop:', error);
    res.status(500).json({ message: 'Error deleting shop' });
  }
});

export default router;
