import { User } from './User.js';
import { Shop } from './Shop.js';
import { Supplier } from './Supplier.js';
import { Product } from './Product.js';
import { ProductVariation } from './ProductVariation.js';
import { Purchase } from './Purchase.js';
import { PurchaseItem } from './PurchaseItem.js';
import { Sale } from './Sale.js';
import { Expense } from './Expense.js';

// User - Shop relationships
Shop.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Shop, { foreignKey: 'created_by', as: 'createdShops' });

// Users belong to shops (for regular users)
User.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });
Shop.hasMany(User, { foreignKey: 'shop_id', as: 'users' });

// Shop - Product relationships
Product.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });
Shop.hasMany(Product, { foreignKey: 'shop_id', as: 'products' });

// Supplier - Product relationships
Product.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Supplier.hasMany(Product, { foreignKey: 'supplier_id', as: 'products' });

// Product - ProductVariation relationships
ProductVariation.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(ProductVariation, { foreignKey: 'product_id', as: 'variations' });

// Shop - Purchase relationships
Purchase.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });
Shop.hasMany(Purchase, { foreignKey: 'shop_id', as: 'purchases' });

// Supplier - Purchase relationships
Purchase.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Supplier.hasMany(Purchase, { foreignKey: 'supplier_id', as: 'purchases' });

// Purchase - PurchaseItem relationships
PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchase_id', as: 'purchase' });
Purchase.hasMany(PurchaseItem, { foreignKey: 'purchase_id', as: 'items' });

// Product - PurchaseItem relationships
PurchaseItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(PurchaseItem, { foreignKey: 'product_id', as: 'purchaseItems' });

// Shop - Sale relationships
Sale.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });
Shop.hasMany(Sale, { foreignKey: 'shop_id', as: 'sales' });

// Product - Sale relationships
Sale.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(Sale, { foreignKey: 'product_id', as: 'sales' });

// ProductVariation - Sale relationships
Sale.belongsTo(ProductVariation, { foreignKey: 'variation_id', as: 'variation' });
ProductVariation.hasMany(Sale, { foreignKey: 'variation_id', as: 'sales' });

// User - Sale relationships
Sale.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Sale, { foreignKey: 'user_id', as: 'sales' });

// Shop - Expense relationships
Expense.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });
Shop.hasMany(Expense, { foreignKey: 'shop_id', as: 'expenses' });

export {
  User,
  Shop,
  Supplier,
  Product,
  ProductVariation,
  Purchase,
  PurchaseItem,
  Sale,
  Expense
};
