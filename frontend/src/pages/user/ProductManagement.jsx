import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import UserLayout from '../../components/UserLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import AdminAuthDialog from '../../components/AdminAuthDialog';
import { useToastContext } from '../../components/AppToast';
import { getProducts, createProduct, updateProduct, deleteProduct, getSuppliers, bulkUpdateProducts, verifyAdminCredentials } from '../../services/api';
import { exportProducts } from '../../services/api';
import './ProductManagement.css';

const ProductManagement = () => {
  const { shopId } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '', status: '' });
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null, title: '' });
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const { showToast } = useToastContext();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    cost_price: '',
    selling_price: '',
    stock: '',
    low_stock_threshold: '10',
    image_url: '',
    status: 'active',
    supplier_id: ''
  });

  useEffect(() => {
    loadProducts();
    loadSuppliers();
  }, [shopId, filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts(shopId, filters);
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await getSuppliers();
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const productData = {
        ...formData,
        shop_id: parseInt(shopId),
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        stock: parseInt(formData.stock) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
        supplier_id: formData.supplier_id || null
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await createProduct(productData);
      }
      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
      showToast(editingProduct ? 'Product updated successfully' : 'Product created successfully', 'success');
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving product');
      showToast(error.response?.data?.message || 'Error saving product', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      cost_price: '',
      selling_price: '',
      stock: '',
      low_stock_threshold: '10',
      image_url: '',
      status: 'active',
      supplier_id: ''
    });
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      stock: product.stock,
      low_stock_threshold: product.low_stock_threshold || '10',
      image_url: product.image_url || '',
      status: product.status,
      supplier_id: product.supplier_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id, name) => {
    setProductToDelete({ id, name });
    setShowAdminAuth(true);
  };

  const handleAdminAuthConfirm = async (username, password) => {
    try {
      // Verify admin credentials first
      await verifyAdminCredentials(username, password);
      
      // If verification successful, delete the product
      await deleteProduct(productToDelete.id, username, password);
      
      // Close dialogs and reload products
      setShowAdminAuth(false);
      setProductToDelete(null);
      loadProducts();
      showToast('Product deleted successfully', 'success');
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete product. Please verify admin credentials.');
    }
  };

  const handleAdminAuthClose = () => {
    setShowAdminAuth(false);
    setProductToDelete(null);
  };

  const handleDuplicate = (product) => {
    setEditingProduct(null);
    setFormData({
      name: `${product.name} (Copy)`,
      description: product.description || '',
      category: product.category || '',
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      stock: '0',
      low_stock_threshold: product.low_stock_threshold || '10',
      image_url: product.image_url || '',
      status: 'active',
      supplier_id: product.supplier_id || ''
    });
    setShowForm(true);
  };

  const handleBulkUpdate = async (field, value) => {
    if (selectedProducts.length === 0) {
      showToast('Please select products first', 'warning');
      return;
    }

    try {
      const updates = { [field]: value };
      await bulkUpdateProducts(selectedProducts, updates);
      setSelectedProducts([]);
      loadProducts();
      showToast('Products updated successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Error updating products', 'error');
    }
  };

  const handleExport = async () => {
    try {
      const response = await exportProducts(shopId);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_${shopId}_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Products exported successfully', 'success');
    } catch (error) {
      showToast('Error exporting products', 'error');
    }
  };

  const toggleProductSelection = (id) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const calculateProfitMargin = (cost, selling) => {
    if (!selling || selling === 0) return 0;
    return ((selling - cost) / selling * 100).toFixed(2);
  };

  return (
    <UserLayout activeTab="products">
      <div className="product-management">
        <div className="page-header-section">
          <h2>Product Management</h2>
          <div className="header-actions">
            <button onClick={handleExport} className="btn btn-secondary">Export CSV</button>
            <button onClick={() => { setShowForm(true); setEditingProduct(null); resetForm(); }} className="btn btn-primary">
              + Add Product
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="search-input"
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Food">Food</option>
            <option value="Books">Books</option>
            <option value="MotorShop">MotorShop</option>
            <option value="VapeShop">VapeShop</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="bulk-actions">
            <span>{selectedProducts.length} product(s) selected</span>
            <div className="bulk-buttons">
              <button onClick={() => handleBulkUpdate('status', 'active')} className="btn btn-sm">Set Active</button>
              <button onClick={() => handleBulkUpdate('status', 'inactive')} className="btn btn-sm">Set Inactive</button>
              <button onClick={selectAll} className="btn btn-sm btn-secondary">Clear Selection</button>
            </div>
          </div>
        )}

        {/* Product Form Modal */}
        {showForm && (
          <div className="form-overlay">
            <div className="form-container">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Food">Food</option>
                      <option value="Books">Books</option>
                      <option value="MotorShop">MotorShop</option>
                      <option value="VapeShop">VapeShop</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Cost Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Selling Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Stock Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Low Stock Threshold</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Supplier</label>
                    <select
                      value={formData.supplier_id}
                      onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    >
                      <option value="">No Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Image URL</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image_url && (
                    <div className="image-preview-wrapper">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="image-preview"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="image-error" style={{ display: 'none' }}>
                        Image failed to load. Please check the URL.
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingProduct ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingProduct(null); resetForm(); }} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Products List */}
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : (
          <>
            {products.length === 0 ? (
              <div className="empty-state">No products found. Create your first product!</div>
            ) : (
              <div className="products-grid">
                {products.map(product => {
                  const margin = calculateProfitMargin(product.cost_price, product.selling_price);
                  const isLowStock = product.stock <= product.low_stock_threshold;
                  
                  return (
                    <div key={product.id} className={`product-card ${isLowStock ? 'low-stock' : ''} ${product.status === 'inactive' ? 'inactive' : ''}`}>
                      <div className="product-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                        />
                      </div>
                      
                      <div className="product-image-wrapper">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="product-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="product-image-placeholder" style={{ display: product.image_url ? 'none' : 'flex' }}>
                          <span>{product.name.charAt(0).toUpperCase()}</span>
                        </div>
                      </div>
                      
                      <div className="product-info">
                        <div className="product-header">
                          <h3>{product.name}</h3>
                          <span className={`status-badge ${product.status}`}>{product.status}</span>
                        </div>
                        
                        {product.category && (
                          <p className="product-category">{product.category}</p>
                        )}
                        
                        {product.description && (
                          <p className="product-description">{product.description}</p>
                        )}

                        <div className="product-details">
                          <div className="detail-row">
                            <span className="label">Cost:</span>
                            <span className="value">₱{parseFloat(product.cost_price).toFixed(2)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Selling:</span>
                            <span className="value price">₱{parseFloat(product.selling_price).toFixed(2)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Stock:</span>
                            <span className={`value ${isLowStock ? 'low-stock-text' : ''}`}>
                              {product.stock} {isLowStock && '⚠️'}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Margin:</span>
                            <span className="value">{margin}%</span>
                          </div>
                          {product.supplier && (
                            <div className="detail-row">
                              <span className="label">Supplier:</span>
                              <span className="value">{product.supplier.name}</span>
                            </div>
                          )}
                        </div>

                        <div className="product-actions">
                          <button onClick={() => handleEdit(product)} className="btn btn-sm btn-edit">Edit</button>
                          <button onClick={() => handleDuplicate(product)} className="btn btn-sm btn-secondary">Duplicate</button>
                          <button onClick={() => handleDelete(product.id, product.name)} className="btn btn-sm btn-delete">Delete</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <ConfirmDialog
          show={confirmDialog.show}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm || (() => setConfirmDialog({ show: false }))}
          onCancel={() => setConfirmDialog({ show: false })}
          confirmText={confirmDialog.confirmText || 'Confirm'}
          cancelText="Cancel"
          danger={confirmDialog.danger}
        />

        {/* Admin Auth Dialog */}
        <AdminAuthDialog
          show={showAdminAuth}
          onClose={handleAdminAuthClose}
          onConfirm={handleAdminAuthConfirm}
          message={`Deleting "${productToDelete?.name}" will permanently remove this product. Admin credentials are required to confirm this action.`}
        />
      </div>
    </UserLayout>
  );
};

export default ProductManagement;
