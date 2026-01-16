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

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Supplier name is required' });
    }

    // Convert empty strings to null for optional fields
    // This ensures Sequelize doesn't try to validate empty strings
    const supplierData = {
      name: name.trim(),
      contact_person: (!contact_person || contact_person.trim() === '') ? null : contact_person.trim(),
      phone: (!phone || phone.trim() === '') ? null : phone.trim(),
      email: (!email || email.trim() === '') ? null : email.trim(),
      address: (!address || address.trim() === '') ? null : address.trim(),
      payment_terms: (!payment_terms || payment_terms.trim() === '') ? null : payment_terms.trim(),
      notes: (!notes || notes.trim() === '') ? null : notes.trim()
    };

    // Only validate email if it's provided
    if (supplierData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplierData.email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const supplier = await Supplier.create(supplierData);

    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ 
      message: 'Error creating supplier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const { name, contact_person, phone, email, address, payment_terms, notes } = req.body;

    // Convert empty strings to null for optional fields
    const updateData = {};
    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Supplier name cannot be empty' });
      }
      updateData.name = name.trim();
    }
    if (contact_person !== undefined) {
      updateData.contact_person = contact_person && contact_person.trim() !== '' ? contact_person.trim() : null;
    }
    if (phone !== undefined) {
      updateData.phone = phone && phone.trim() !== '' ? phone.trim() : null;
    }
    if (email !== undefined) {
      if (email && email.trim() !== '') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          return res.status(400).json({ message: 'Please enter a valid email address' });
        }
        updateData.email = email.trim();
      } else {
        updateData.email = null;
      }
    }
    if (address !== undefined) {
      updateData.address = address && address.trim() !== '' ? address.trim() : null;
    }
    if (payment_terms !== undefined) {
      updateData.payment_terms = payment_terms && payment_terms.trim() !== '' ? payment_terms.trim() : null;
    }
    if (notes !== undefined) {
      updateData.notes = notes && notes.trim() !== '' ? notes.trim() : null;
    }

    await supplier.update(updateData);
    res.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ 
      message: 'Error updating supplier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete supplier (requires admin credentials)
router.delete('/:id', async (req, res) => {
  try {
    const { adminUsername, adminPassword } = req.body;
    
    // Verify admin credentials
    if (!adminUsername || !adminPassword) {
      return res.status(400).json({ message: 'Admin credentials are required to delete a supplier' });
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

    // Get the supplier to delete
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    await supplier.destroy();
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ 
      message: 'Error deleting supplier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
