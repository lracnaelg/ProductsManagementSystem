import express from 'express';
import { User, Shop } from '../../models/index.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
      include: [
        { model: Shop, as: 'shop', attributes: ['id', 'name'] }
      ],
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get users for a specific shop
router.get('/shop/:shopId', async (req, res) => {
  try {
    const users = await User.findAll({
      where: { shop_id: req.params.shopId },
      include: [
        { model: Shop, as: 'shop', attributes: ['id', 'name'] }
      ],
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching shop users:', error);
    res.status(500).json({ message: 'Error fetching shop users' });
  }
});

// Create user for a shop
router.post('/', async (req, res) => {
  try {
    const { username, password, email, shop_id, active } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (!shop_id) {
      return res.status(400).json({ message: 'Shop ID is required for user accounts' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Verify shop exists
    const shop = await Shop.findByPk(shop_id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const user = await User.create({
      username,
      password,
      email,
      role: 'user',
      shop_id,
      active: active !== undefined ? active : true
    });

    const userWithShop = await User.findByPk(user.id, {
      include: [{ model: Shop, as: 'shop', attributes: ['id', 'name'] }],
      attributes: { exclude: ['password'] }
    });

    res.status(201).json(userWithShop);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If shop_id is being changed, verify it exists
    if (req.body.shop_id) {
      const shop = await Shop.findByPk(req.body.shop_id);
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
    }

    // If password is empty, don't update it
    const updateData = { ...req.body };
    if (!updateData.password || updateData.password === '') {
      delete updateData.password;
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(user.id, {
      include: [{ model: Shop, as: 'shop', attributes: ['id', 'name'] }],
      attributes: { exclude: ['password'] }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

export default router;
