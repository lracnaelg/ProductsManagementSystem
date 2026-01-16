import express from 'express';
import { Product, Sale, Purchase, Shop, Supplier, PurchaseItem } from '../models/index.js';
import { authenticateToken, requireUser } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

router.use(authenticateToken);
router.use(requireUser);

// Export products to CSV
router.get('/products', async (req, res) => {
  try {
    const { shopId } = req.query;

    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    const products = await Product.findAll({
      where: { shop_id: shopId },
      include: [
        { model: Shop, as: 'shop', attributes: ['name'] },
        { model: Supplier, as: 'supplier', attributes: ['name'] }
      ]
    });

    // Convert to CSV format
    const headers = ['ID', 'Name', 'Description', 'Category', 'Cost Price', 'Selling Price', 'Stock', 'Status', 'Supplier', 'Shop'];
    const rows = products.map(product => [
      product.id,
      product.name,
      product.description || '',
      product.category || '',
      product.cost_price,
      product.selling_price,
      product.stock,
      product.status,
      product.supplier?.name || '',
      product.shop?.name || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=products_${shopId}_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting products:', error);
    res.status(500).json({ message: 'Error exporting products' });
  }
});

// Export sales to CSV
router.get('/sales', async (req, res) => {
  try {
    const { shopId, startDate, endDate } = req.query;

    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    let where = { shop_id: shopId };
    if (startDate || endDate) {
      where.sale_date = {};
      if (startDate) where.sale_date[Op.gte] = new Date(startDate);
      if (endDate) where.sale_date[Op.lte] = new Date(endDate);
    }

    const sales = await Sale.findAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['name'] },
        { model: Shop, as: 'shop', attributes: ['name'] }
      ],
      order: [['sale_date', 'DESC']]
    });

    const headers = ['ID', 'Date', 'Product', 'Quantity', 'Unit Price', 'Total Amount', 'Shop'];
    const rows = sales.map(sale => [
      sale.id,
      sale.sale_date,
      sale.product?.name || '',
      sale.quantity_sold,
      sale.unit_price,
      sale.total_amount,
      sale.shop?.name || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales_${shopId}_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting sales:', error);
    res.status(500).json({ message: 'Error exporting sales' });
  }
});

// Export purchases to CSV
router.get('/purchases', async (req, res) => {
  try {
    const { shopId, startDate, endDate } = req.query;

    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    let where = { shop_id: shopId };
    if (startDate || endDate) {
      where.purchase_date = {};
      if (startDate) where.purchase_date[Op.gte] = new Date(startDate);
      if (endDate) where.purchase_date[Op.lte] = new Date(endDate);
    }

    const purchases = await Purchase.findAll({
      where,
      include: [
        { model: Shop, as: 'shop', attributes: ['name'] },
        { model: Supplier, as: 'supplier', attributes: ['name'] },
        {
          model: PurchaseItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['name'] }]
        }
      ],
      order: [['purchase_date', 'DESC']]
    });

    const headers = ['ID', 'Date', 'Supplier', 'Total Cost', 'Shipping', 'Fees', 'Shop', 'Items'];
    const rows = purchases.map(purchase => [
      purchase.id,
      purchase.purchase_date,
      purchase.supplier?.name || '',
      purchase.total_cost,
      purchase.shipping_cost,
      purchase.fees,
      purchase.shop?.name || '',
      purchase.items?.map(item => `${item.product?.name} (${item.quantity})`).join('; ') || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=purchases_${shopId}_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting purchases:', error);
    res.status(500).json({ message: 'Error exporting purchases' });
  }
});

export default router;
