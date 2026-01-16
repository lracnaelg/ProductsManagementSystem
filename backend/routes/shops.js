import express from 'express';
import { Shop } from '../models/index.js';
import { authenticateToken, requireUser } from '../middleware/auth.js';

const router = express.Router();

// Get all shops for selection (public - no auth required for shop selection)
router.get('/', async (req, res) => {
  try {
    const shops = await Shop.findAll({
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'description', 'category']
    });

    res.json(shops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ message: 'Error fetching shops' });
  }
});

// Get single shop
router.get('/:id', authenticateToken, requireUser, async (req, res) => {
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

export default router;
