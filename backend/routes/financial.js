import express from 'express';
import { Product, Sale, Expense, Shop } from '../models/index.js';
import { authenticateToken, requireUser } from '../middleware/auth.js';
import { Op } from 'sequelize';
import sequelize from 'sequelize';

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

// Get dashboard metrics
router.get('/dashboard', validateShopAccess, async (req, res) => {
  try {
    const { shopId } = req.query;

    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    // Today's sales
    const todaySales = await Sale.findAll({
      where: {
        shop_id: shopId,
        sale_date: {
          [Op.between]: [todayStart, todayEnd]
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Sale.id')), 'transactions'],
        [sequelize.fn('SUM', sequelize.col('Sale.total_amount')), 'revenue']
      ]
    });

    const todayRevenue = parseFloat(todaySales[0]?.dataValues?.revenue || 0);
    const todayTransactions = parseInt(todaySales[0]?.dataValues?.transactions || 0);

    // Calculate today's profit
    const todaySalesDetails = await Sale.findAll({
      where: {
        shop_id: shopId,
        sale_date: {
          [Op.between]: [todayStart, todayEnd]
        }
      },
      include: [{ model: Product, as: 'product', attributes: ['cost_price'] }]
    });

    let todayCost = 0;
    todaySalesDetails.forEach(sale => {
      const costPrice = parseFloat(sale.product?.cost_price || 0);
      todayCost += costPrice * sale.quantity_sold;
    });

    const todayProfit = todayRevenue - todayCost;

    // Total inventory value
    const products = await Product.findAll({
      where: { shop_id: shopId },
      attributes: ['id', 'cost_price', 'stock']
    });

    const inventoryValue = products.reduce((sum, product) => {
      return sum + (parseFloat(product.cost_price) * parseInt(product.stock));
    }, 0);

    res.json({
      today: {
        revenue: todayRevenue,
        profit: todayProfit,
        transactions: todayTransactions,
        cost: todayCost
      },
      inventoryValue: inventoryValue.toFixed(2)
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ message: 'Error fetching dashboard metrics' });
  }
});

// Get revenue/profit trends
router.get('/trends', validateShopAccess, async (req, res) => {
  try {
    const { shopId, period = 'daily' } = req.query;

    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    let dateFormat, startDate, endDate;

    const now = new Date();
    if (period === 'daily') {
      dateFormat = '%Y-%m-%d';
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = now;
    } else if (period === 'weekly') {
      dateFormat = '%Y-%u';
      startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
      endDate = now;
    } else if (period === 'monthly') {
      dateFormat = '%Y-%m';
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
      endDate = now;
    }

    const trends = await Sale.findAll({
      where: {
        shop_id: shopId,
        sale_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('Sale.sale_date'), dateFormat), 'period'],
        [sequelize.fn('SUM', sequelize.col('Sale.total_amount')), 'revenue']
      ],
      group: ['period'],
      order: [['period', 'ASC']],
      include: [{ model: Product, as: 'product', attributes: ['cost_price'] }]
    });

    // Calculate profit for each period
    const trendsWithProfit = await Promise.all(
      trends.map(async (trend) => {
        const periodStart = new Date(trend.dataValues.period + (period === 'daily' ? '' : '-01'));
        const periodEnd = period === 'daily' 
          ? new Date(periodStart.getTime() + 24 * 60 * 60 * 1000)
          : new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);

        const periodSales = await Sale.findAll({
          where: {
            shop_id: shopId,
            sale_date: {
              [Op.between]: [periodStart, periodEnd]
            }
          },
          include: [{ model: Product, as: 'product', attributes: ['cost_price'] }]
        });

        let cost = 0;
        periodSales.forEach(sale => {
          const costPrice = parseFloat(sale.product?.cost_price || 0);
          cost += costPrice * sale.quantity_sold;
        });

        const revenue = parseFloat(trend.dataValues.revenue || 0);
        const profit = revenue - cost;

        return {
          period: trend.dataValues.period,
          revenue: revenue.toFixed(2),
          profit: profit.toFixed(2),
          cost: cost.toFixed(2)
        };
      })
    );

    res.json(trendsWithProfit);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ message: 'Error fetching trends' });
  }
});

// Get profit margins per product
router.get('/margins', validateShopAccess, async (req, res) => {
  try {
    const { shopId } = req.query;

    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    const products = await Product.findAll({
      where: { shop_id: shopId, status: 'active' }
    });

    const margins = await Promise.all(
      products.map(async (product) => {
        const sales = await Sale.findAll({
          where: { product_id: product.id },
          attributes: [
            [sequelize.fn('SUM', sequelize.col('quantity_sold')), 'totalSold'],
            [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue']
          ]
        });

        const costPrice = parseFloat(product.cost_price);
        const sellingPrice = parseFloat(product.selling_price);
        const profitMargin = sellingPrice > 0 
          ? ((sellingPrice - costPrice) / sellingPrice) * 100 
          : 0;

        const totalSold = parseInt(sales[0]?.dataValues?.totalSold || 0);
        const totalRevenue = parseFloat(sales[0]?.dataValues?.totalRevenue || 0);
        const totalCost = costPrice * totalSold;
        const totalProfit = totalRevenue - totalCost;

        return {
          productId: product.id,
          productName: product.name,
          costPrice: costPrice.toFixed(2),
          sellingPrice: sellingPrice.toFixed(2),
          profitMargin: profitMargin.toFixed(2),
          totalSold,
          totalRevenue: totalRevenue.toFixed(2),
          totalCost: totalCost.toFixed(2),
          totalProfit: totalProfit.toFixed(2)
        };
      })
    );

    res.json(margins);
  } catch (error) {
    console.error('Error fetching margins:', error);
    res.status(500).json({ message: 'Error fetching margins' });
  }
});

// Get gross vs net profit
router.get('/gross-vs-net', validateShopAccess, async (req, res) => {
  try {
    const { shopId, startDate, endDate } = req.query;

    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    let saleWhere = { shop_id: shopId };
    let expenseWhere = { shop_id: shopId };

    if (startDate || endDate) {
      saleWhere.sale_date = {};
      expenseWhere.expense_date = {};
      if (startDate) {
        saleWhere.sale_date[Op.gte] = new Date(startDate);
        expenseWhere.expense_date[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        saleWhere.sale_date[Op.lte] = new Date(endDate);
        expenseWhere.expense_date[Op.lte] = new Date(endDate);
      }
    }

    // Calculate gross revenue
    const sales = await Sale.findAll({
      where: saleWhere,
      include: [{ model: Product, as: 'product', attributes: ['cost_price'] }]
    });

    let grossRevenue = 0;
    let totalCost = 0;

    sales.forEach(sale => {
      const revenue = parseFloat(sale.total_amount);
      const costPrice = parseFloat(sale.product?.cost_price || 0);
      grossRevenue += revenue;
      totalCost += costPrice * sale.quantity_sold;
    });

    const grossProfit = grossRevenue - totalCost;

    // Calculate expenses
    const expenses = await Expense.findAll({
      where: expenseWhere
    });

    const totalExpenses = expenses.reduce((sum, expense) => {
      return sum + parseFloat(expense.amount);
    }, 0);

    const netProfit = grossProfit - totalExpenses;

    res.json({
      grossRevenue: grossRevenue.toFixed(2),
      totalCost: totalCost.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      netProfit: netProfit.toFixed(2),
      profitMargin: grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Error fetching gross vs net profit:', error);
    res.status(500).json({ message: 'Error fetching gross vs net profit' });
  }
});

export default router;
