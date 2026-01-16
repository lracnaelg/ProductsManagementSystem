import express from 'express';
import { Supplier, Product, Purchase } from '../models/index.js';
import { authenticateToken, requireUser } from '../middleware/auth.js';
import { Op } from 'sequelize';
import sequelize from 'sequelize';

const router = express.Router();

router.use(authenticateToken);
router.use(requireUser);

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { contact_person: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const suppliers = await Supplier.findAll({
      where,
      order: [['name', 'ASC']]
    });

    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ message: 'Error fetching suppliers' });
  }
});

// Get single supplier
router.get('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'name', 'cost_price', 'selling_price']
        }
      ]
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ message: 'Error fetching supplier' });
  }
});

// Create supplier
router.post('/', async (req, res) => {
  try {
    const { name, contact_person, phone, email, address, payment_terms, notes } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Supplier name is required' });
    }

    const supplier = await Supplier.create({
      name,
      contact_person,
      phone,
      email,
      address,
      payment_terms,
      notes
    });

    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ message: 'Error creating supplier' });
  }
});

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    await supplier.update(req.body);
    res.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ message: 'Error updating supplier' });
  }
});

// Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    await supplier.destroy();
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ message: 'Error deleting supplier' });
  }
});

// Get products for a supplier
router.get('/:id/products', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { supplier_id: req.params.id },
      include: [{ model: Supplier, as: 'supplier' }]
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    res.status(500).json({ message: 'Error fetching supplier products' });
  }
});

// Get purchase history for a supplier
router.get('/:id/purchases', async (req, res) => {
  try {
    const purchases = await Purchase.findAll({
      where: { supplier_id: req.params.id },
      order: [['purchase_date', 'DESC']],
      include: [
        {
          model: Purchase,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });

    const totalSpent = await Purchase.sum('total_cost', {
      where: { supplier_id: req.params.id }
    });

    res.json({ purchases, totalSpent: totalSpent || 0 });
  } catch (error) {
    console.error('Error fetching supplier purchases:', error);
    res.status(500).json({ message: 'Error fetching supplier purchases' });
  }
});

// Compare supplier prices for a product
router.get('/compare/:productId', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { id: req.params.productId },
      include: [{ model: Supplier, as: 'supplier' }]
    });

    // Get all suppliers that supply similar products
    const similarProducts = await Product.findAll({
      where: {
        name: { [Op.like]: `%${products[0]?.name || ''}%` }
      },
      include: [{ model: Supplier, as: 'supplier' }],
      attributes: ['id', 'name', 'cost_price', 'supplier_id']
    });

    res.json(similarProducts);
  } catch (error) {
    console.error('Error comparing suppliers:', error);
    res.status(500).json({ message: 'Error comparing suppliers' });
  }
});

export default router;
