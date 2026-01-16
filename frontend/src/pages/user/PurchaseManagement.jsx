import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import UserLayout from '../../components/UserLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToastContext } from '../../components/AppToast';
import { getPurchases, createPurchase, getSuppliers, getProducts, exportPurchases } from '../../services/api';
import './PurchaseManagement.css';

const PurchaseManagement = () => {
  const { shopId } = useParams();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', supplierId: '' });
  const [error, setError] = useState('');
  const { showToast } = useToastContext();

  const [formData, setFormData] = useState({
    supplier_id: '',
    items: [{ 
      product_id: '', 
      product_name: '', 
      product_category: '', 
      product_description: '', 
      product_selling_price: '', 
      quantity: '', 
      unit_cost: '',
      isNewProduct: false
    }],
    shipping_cost: '',
    fees: '',
    purchase_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadPurchases();
    loadSuppliers();
    loadProducts();
  }, [shopId, filters]);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const params = { shopId };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.supplierId) params.supplierId = filters.supplierId;

      const response = await getPurchases(params);
      setPurchases(response.data);
    } catch (error) {
      console.error('Error loading purchases:', error);
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

  const loadProducts = async () => {
    try {
      const response = await getProducts(shopId);
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate items
    const validItems = formData.items.filter(item => {
      if (item.isNewProduct) {
        return item.product_name && item.quantity && item.unit_cost;
      } else {
        return item.product_id && item.quantity && item.unit_cost;
      }
    });
    
    if (validItems.length === 0) {
      setError('Please add at least one item');
      return;
    }

    try {
      const purchaseData = {
        shop_id: parseInt(shopId),
        supplier_id: parseInt(formData.supplier_id),
        items: validItems.map(item => {
          const baseItem = {
            quantity: parseInt(item.quantity),
            unit_cost: parseFloat(item.unit_cost)
          };
          
          if (item.isNewProduct) {
            return {
              ...baseItem,
              product_name: item.product_name,
              product_category: item.product_category || '',
              product_description: item.product_description || '',
              product_selling_price: item.product_selling_price || ''
            };
          } else {
            return {
              ...baseItem,
              product_id: parseInt(item.product_id)
            };
          }
        }),
        shipping_cost: parseFloat(formData.shipping_cost) || 0,
        fees: parseFloat(formData.fees) || 0,
        purchase_date: formData.purchase_date || new Date().toISOString(),
        notes: formData.notes
      };

      await createPurchase(purchaseData);
      setShowForm(false);
      setFormData({
        supplier_id: '',
        items: [{ 
          product_id: '', 
          product_name: '', 
          product_category: '', 
          product_description: '', 
          product_selling_price: '', 
          quantity: '', 
          unit_cost: '',
          isNewProduct: false
        }],
        shipping_cost: '',
        fees: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      loadPurchases();
      loadProducts(); // Reload to see updated stock
      showToast('Purchase recorded successfully', 'success');
    } catch (error) {
      setError(error.response?.data?.message || 'Error recording purchase');
      showToast(error.response?.data?.message || 'Error recording purchase', 'error');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { 
        product_id: '', 
        product_name: '', 
        product_category: '', 
        product_description: '', 
        product_selling_price: '', 
        quantity: '', 
        unit_cost: '',
        isNewProduct: false
      }]
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Auto-populate cost if product is selected
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].unit_cost = product.cost_price || '';
        newItems[index].isNewProduct = false;
      }
    }
    
    // If switching to new product mode, clear product_id
    if (field === 'isNewProduct' && value === true) {
      newItems[index].product_id = '';
    }
    
    // If switching to existing product mode, clear new product fields
    if (field === 'isNewProduct' && value === false) {
      newItems[index].product_name = '';
      newItems[index].product_category = '';
      newItems[index].product_description = '';
      newItems[index].product_selling_price = '';
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => {
      if (item.quantity && item.unit_cost) {
        return sum + (parseInt(item.quantity) * parseFloat(item.unit_cost));
      }
      return sum;
    }, 0);
    const shipping = parseFloat(formData.shipping_cost) || 0;
    const fees = parseFloat(formData.fees) || 0;
    return itemsTotal + shipping + fees;
  };

  const handleExport = async () => {
    try {
      const response = await exportPurchases(
        shopId,
        filters.startDate || undefined,
        filters.endDate || undefined
      );
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `purchases_${shopId}_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Purchases exported successfully', 'success');
    } catch (error) {
      showToast('Error exporting purchases', 'error');
    }
  };

  return (
    <UserLayout activeTab="purchases">
      <div className="purchase-management">
        <div className="page-header-section">
          <h2>Purchase Management</h2>
          <div className="header-actions">
            <button onClick={handleExport} className="btn btn-secondary">Export CSV</button>
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              + Record Purchase
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Purchases</h3>
            <p className="summary-value">
              ₱{purchases.reduce((sum, p) => sum + parseFloat(p.total_cost || 0), 0).toFixed(2)}
            </p>
            <span className="summary-count">{purchases.length} purchase(s)</span>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="filter-input"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="filter-input"
            placeholder="End Date"
          />
          <select
            value={filters.supplierId}
            onChange={(e) => setFilters({ ...filters, supplierId: e.target.value })}
            className="filter-select"
          >
            <option value="">All Suppliers</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
          <button onClick={() => setFilters({ startDate: '', endDate: '', supplierId: '' })} className="btn btn-secondary">
            Clear Filters
          </button>
        </div>

        {/* Purchase Form Modal */}
        {showForm && (
          <div className="form-overlay">
            <div className="form-container">
              <h2>Record Purchase / Restocking</h2>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Supplier *</label>
                    <select
                      value={formData.supplier_id}
                      onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Purchase Date</label>
                    <input
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="items-section">
                  <div className="section-header">
                    <h3>Items</h3>
                    <button type="button" onClick={addItem} className="btn btn-sm btn-secondary">
                      + Add Item
                    </button>
                  </div>

                  {formData.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <div className="item-product-selector">
                        <label>
                          <input
                            type="radio"
                            checked={!item.isNewProduct}
                            onChange={() => updateItem(index, 'isNewProduct', false)}
                          />
                          Existing Product
                        </label>
                        <label>
                          <input
                            type="radio"
                            checked={item.isNewProduct}
                            onChange={() => updateItem(index, 'isNewProduct', true)}
                          />
                          New Product
                        </label>
                      </div>
                      
                      {!item.isNewProduct ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Select Product *</label>
                          <select
                            value={item.product_id}
                            onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                            required
                            className="item-select"
                          >
                            <option value="">Choose an existing product...</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>{product.name}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="new-product-fields">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Product Name *</label>
                            <input
                              type="text"
                              placeholder="Enter product name"
                              value={item.product_name}
                              onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                              required
                              className="item-input"
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Category</label>
                            <input
                              type="text"
                              placeholder="e.g., Electronics"
                              value={item.product_category}
                              onChange={(e) => updateItem(index, 'product_category', e.target.value)}
                              className="item-input"
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Selling Price</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Auto: 50% markup"
                              value={item.product_selling_price}
                              onChange={(e) => updateItem(index, 'product_selling_price', e.target.value)}
                              className="item-input"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="item-input-row">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Quantity *</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="Enter quantity"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            required
                            className="item-input"
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Unit Cost *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Enter unit cost"
                            value={item.unit_cost}
                            onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                            required
                            className="item-input"
                          />
                        </div>
                      </div>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="btn btn-sm btn-delete remove-item-btn"
                        >
                          Remove Item
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Shipping Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.shipping_cost}
                      onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fees / Taxes</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.fees}
                      onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                  />
                </div>

                <div className="total-preview">
                  <strong>Total: ₱{calculateTotal().toFixed(2)}</strong>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Record Purchase
                  </button>
                  <button type="button" onClick={() => {
                    setShowForm(false);
                    setFormData({
                      supplier_id: '',
                      items: [{ 
                        product_id: '', 
                        product_name: '', 
                        product_category: '', 
                        product_description: '', 
                        product_selling_price: '', 
                        quantity: '', 
                        unit_cost: '',
                        isNewProduct: false
                      }],
                      shipping_cost: '',
                      fees: '',
                      purchase_date: new Date().toISOString().split('T')[0],
                      notes: ''
                    });
                  }} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Purchases List */}
        {loading ? (
          <div className="loading">Loading purchases...</div>
        ) : (
          <>
            {purchases.length === 0 ? (
              <div className="empty-state">No purchases found. Record your first purchase!</div>
            ) : (
              <div className="purchases-list">
                {purchases.map(purchase => (
                  <div key={purchase.id} className="purchase-card">
                    <div className="purchase-header">
                      <div>
                        <h3>{purchase.supplier?.name || 'N/A'}</h3>
                        <p className="purchase-date">{new Date(purchase.purchase_date).toLocaleDateString()}</p>
                      </div>
                      <div className="purchase-total">
                        ₱{parseFloat(purchase.total_cost).toFixed(2)}
                      </div>
                    </div>
                    <div className="purchase-details">
                      <div className="detail-item">
                        <span className="label">Items:</span>
                        <span>{purchase.items?.length || 0}</span>
                      </div>
                      {purchase.shipping_cost > 0 && (
                        <div className="detail-item">
                          <span className="label">Shipping:</span>
                          <span>₱{parseFloat(purchase.shipping_cost).toFixed(2)}</span>
                        </div>
                      )}
                      {purchase.fees > 0 && (
                        <div className="detail-item">
                          <span className="label">Fees:</span>
                          <span>₱{parseFloat(purchase.fees).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    {purchase.items && purchase.items.length > 0 && (
                      <div className="purchase-items">
                        {purchase.items.map((item, idx) => (
                          <div key={idx} className="purchase-item">
                            <span>{item.product?.name || 'N/A'}</span>
                            <span>Qty: {item.quantity}</span>
                            <span>₱{parseFloat(item.unit_cost).toFixed(2)} each</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
};

export default PurchaseManagement;
