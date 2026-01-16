import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import UserLayout from '../../components/UserLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import AdminAuthDialog from '../../components/AdminAuthDialog';
import { useToastContext } from '../../components/AppToast';
import { getSales, createSale, getProducts, exportSales, deleteSale, verifyAdminCredentials } from '../../services/api';
import './SalesManagement.css';

const SalesManagement = () => {
  const { shopId } = useParams();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', productId: '' });
  const [error, setError] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const { showToast } = useToastContext();

  const [formData, setFormData] = useState({
    product_id: '',
    variation_id: '',
    quantity_sold: '',
    unit_price: '',
    sale_date: new Date().toISOString().split('T')[0]
  });

  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadSales();
    loadProducts();
  }, [shopId, filters]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const params = { shopId };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.productId) params.productId = filters.productId;

      const response = await getSales(params);
      setSales(response.data);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await getProducts(shopId, { status: 'active' });
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    setSelectedProduct(product);
    setFormData({
      ...formData,
      product_id: productId,
      variation_id: '',
      unit_price: product ? product.selling_price : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const saleData = {
        ...formData,
        shop_id: parseInt(shopId),
        product_id: parseInt(formData.product_id),
        variation_id: formData.variation_id || null,
        quantity_sold: parseInt(formData.quantity_sold),
        unit_price: parseFloat(formData.unit_price),
        sale_date: formData.sale_date || new Date().toISOString()
      };

      await createSale(saleData);
      setShowForm(false);
      setFormData({
        product_id: '',
        variation_id: '',
        quantity_sold: '',
        unit_price: '',
        sale_date: new Date().toISOString().split('T')[0]
      });
      setSelectedProduct(null);
      loadSales();
      loadProducts(); // Reload to update stock
      showToast('Sale recorded successfully', 'success');
    } catch (error) {
      setError(error.response?.data?.message || 'Error recording sale');
      showToast(error.response?.data?.message || 'Error recording sale', 'error');
    }
  };

  const handleExport = async () => {
    try {
      const response = await exportSales(
        shopId,
        filters.startDate || undefined,
        filters.endDate || undefined
      );
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_${shopId}_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Sales exported successfully', 'success');
    } catch (error) {
      showToast('Error exporting sales', 'error');
    }
  };

  const calculateTotal = () => {
    return sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
  };

  const handleDeleteClick = (sale) => {
    setSaleToDelete(sale);
    setShowAdminAuth(true);
  };

  const handleAdminAuthConfirm = async (username, password) => {
    try {
      // Verify admin credentials first
      await verifyAdminCredentials(username, password);
      
      // If verification successful, delete the sale
      await deleteSale(saleToDelete.id, username, password);
      
      // Close dialogs and reload sales
      setShowAdminAuth(false);
      setSaleToDelete(null);
      loadSales();
      loadProducts(); // Reload to update stock
      showToast('Sale deleted successfully', 'success');
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete sale. Please verify admin credentials.');
    }
  };

  const handleAdminAuthClose = () => {
    setShowAdminAuth(false);
    setSaleToDelete(null);
  };

  return (
    <UserLayout activeTab="sales">
      <div className="sales-management">
        <div className="page-header-section">
          <h2>Sales Management</h2>
          <div className="header-actions">
            <button onClick={handleExport} className="btn btn-secondary">Export CSV</button>
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              + Record Sale
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Sales</h3>
            <p className="summary-value">₱{calculateTotal().toFixed(2)}</p>
            <span className="summary-count">{sales.length} transaction(s)</span>
          </div>
          <div className="summary-card">
            <h3>Total Quantity</h3>
            <p className="summary-value">
              {sales.reduce((sum, sale) => sum + (sale.quantity_sold || 0), 0)}
            </p>
            <span className="summary-count">items sold</span>
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
            value={filters.productId}
            onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
            className="filter-select"
          >
            <option value="">All Products</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
          <button onClick={() => setFilters({ startDate: '', endDate: '', productId: '' })} className="btn btn-secondary">
            Clear Filters
          </button>
        </div>

        {/* Sales Form Modal */}
        {showForm && (
          <div className="form-overlay">
            <div className="form-container">
              <h2>Record Sale</h2>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Product *</label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => handleProductChange(e.target.value)}
                    required
                  >
                    <option value="">Select Product</option>
                    {products
                      .filter(p => p.stock > 0)
                      .map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} (Stock: {product.stock})
                        </option>
                      ))}
                  </select>
                </div>

                {selectedProduct && selectedProduct.variations && selectedProduct.variations.length > 0 && (
                  <div className="form-group">
                    <label>Variation (Optional)</label>
                    <select
                      value={formData.variation_id}
                      onChange={(e) => {
                        const variation = selectedProduct.variations.find(v => v.id === parseInt(e.target.value));
                        setFormData({
                          ...formData,
                          variation_id: e.target.value,
                          unit_price: variation ? variation.selling_price : selectedProduct.selling_price
                        });
                      }}
                    >
                      <option value="">No Variation</option>
                      {selectedProduct.variations.map(variation => (
                        <option key={variation.id} value={variation.id}>
                          {variation.variation_type}: {variation.variation_value} (Stock: {variation.stock}) - ₱{variation.selling_price}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct ? (formData.variation_id 
                        ? selectedProduct.variations.find(v => v.id === parseInt(formData.variation_id))?.stock 
                        : selectedProduct.stock) : ''}
                      value={formData.quantity_sold}
                      onChange={(e) => setFormData({ ...formData, quantity_sold: e.target.value })}
                      required
                    />
                    {selectedProduct && (
                      <small className="form-hint">
                        Available: {formData.variation_id 
                          ? selectedProduct.variations.find(v => v.id === parseInt(formData.variation_id))?.stock || 0
                          : selectedProduct.stock}
                      </small>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Unit Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Sale Date</label>
                  <input
                    type="date"
                    value={formData.sale_date}
                    onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                    required
                  />
                </div>

                {formData.quantity_sold && formData.unit_price && (
                  <div className="total-preview">
                    <strong>Total: ₱{(parseFloat(formData.quantity_sold) * parseFloat(formData.unit_price)).toFixed(2)}</strong>
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Record Sale
                  </button>
                  <button type="button" onClick={() => {
                    setShowForm(false);
                    setFormData({
                      product_id: '',
                      variation_id: '',
                      quantity_sold: '',
                      unit_price: '',
                      sale_date: new Date().toISOString().split('T')[0]
                    });
                    setSelectedProduct(null);
                  }} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sales List */}
        {loading ? (
          <div className="loading">Loading sales...</div>
        ) : (
          <>
            {sales.length === 0 ? (
              <div className="empty-state">No sales found. Record your first sale!</div>
            ) : (
              <div className="sales-table-container">
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Product</th>
                      <th>Variation</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map(sale => (
                      <tr key={sale.id}>
                        <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                        <td>{sale.product?.name || 'N/A'}</td>
                        <td>
                          {sale.variation 
                            ? `${sale.variation.variation_type}: ${sale.variation.variation_value}`
                            : '-'}
                        </td>
                        <td>{sale.quantity_sold}</td>
                        <td>₱{parseFloat(sale.unit_price).toFixed(2)}</td>
                        <td className="total-amount">₱{parseFloat(sale.total_amount).toFixed(2)}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteClick(sale)}
                            className="btn-delete"
                            title="Delete sale (requires admin credentials)"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Admin Auth Dialog */}
        <AdminAuthDialog
          show={showAdminAuth}
          onClose={handleAdminAuthClose}
          onConfirm={handleAdminAuthConfirm}
          message="Deleting a sale will restore the product stock. Admin credentials are required to confirm this action."
        />
      </div>
    </UserLayout>
  );
};

export default SalesManagement;
