import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import UserLayout from '../../components/UserLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import AdminAuthDialog from '../../components/AdminAuthDialog';
import { useToastContext } from '../../components/AppToast';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, getSupplierProducts, getSupplierPurchases, verifyAdminCredentials } from '../../services/api';
import './SupplierManagement.css';

const SupplierManagement = () => {
  const { shopId } = useParams();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [supplierPurchases, setSupplierPurchases] = useState(null);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null, title: '' });
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const { showToast } = useToastContext();

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    payment_terms: '',
    notes: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await getSuppliers();
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
      } else {
        await createSupplier(formData);
      }
      setShowForm(false);
      setEditingSupplier(null);
      resetForm();
      loadSuppliers();
      showToast(editingSupplier ? 'Supplier updated successfully' : 'Supplier created successfully', 'success');
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving supplier');
      showToast(error.response?.data?.message || 'Error saving supplier', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      payment_terms: '',
      notes: ''
    });
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      payment_terms: supplier.payment_terms || '',
      notes: supplier.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id, name) => {
    setSupplierToDelete({ id, name });
    setShowAdminAuth(true);
  };

  const handleAdminAuthConfirm = async (username, password) => {
    try {
      // Verify admin credentials first
      await verifyAdminCredentials(username, password);
      
      // If verification successful, delete the supplier
      await deleteSupplier(supplierToDelete.id, username, password);
      
      // Close dialogs and reload suppliers
      setShowAdminAuth(false);
      setSupplierToDelete(null);
      loadSuppliers();
      showToast('Supplier deleted successfully', 'success');
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete supplier. Please verify admin credentials.');
    }
  };

  const handleAdminAuthClose = () => {
    setShowAdminAuth(false);
    setSupplierToDelete(null);
  };

  const handleViewDetails = async (supplier) => {
    setSelectedSupplier(supplier);
    try {
      const [productsRes, purchasesRes] = await Promise.all([
        getSupplierProducts(supplier.id),
        getSupplierPurchases(supplier.id)
      ]);
      setSupplierProducts(productsRes.data);
      setSupplierPurchases(purchasesRes.data);
    } catch (error) {
      console.error('Error loading supplier details:', error);
    }
  };

  return (
    <UserLayout activeTab="suppliers">
      <div className="supplier-management">
        <div className="page-header-section">
          <h2>Supplier Management</h2>
          <button onClick={() => { setShowForm(true); setEditingSupplier(null); resetForm(); }} className="btn btn-primary">
            + Add Supplier
          </button>
        </div>

        {/* Supplier Form Modal */}
        {showForm && (
          <div className="form-overlay">
            <div className="form-container">
              <h2>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Supplier Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Contact Person</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>Payment Terms</label>
                  <textarea
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    rows="2"
                    placeholder="e.g., Net 30, Cash on Delivery"
                  />
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingSupplier ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingSupplier(null); resetForm(); }} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Supplier Details Modal */}
        {selectedSupplier && (
          <div className="form-overlay">
            <div className="form-container details-container">
              <div className="details-header">
                <h2>{selectedSupplier.name}</h2>
                <button onClick={() => setSelectedSupplier(null)} className="close-btn">&times;</button>
              </div>

              <div className="details-content">
                <div className="contact-info">
                  <h3>Contact Information</h3>
                  {selectedSupplier.contact_person && (
                    <p><strong>Contact:</strong> {selectedSupplier.contact_person}</p>
                  )}
                  {selectedSupplier.phone && (
                    <p><strong>Phone:</strong> {selectedSupplier.phone}</p>
                  )}
                  {selectedSupplier.email && (
                    <p><strong>Email:</strong> {selectedSupplier.email}</p>
                  )}
                  {selectedSupplier.address && (
                    <p><strong>Address:</strong> {selectedSupplier.address}</p>
                  )}
                  {selectedSupplier.payment_terms && (
                    <p><strong>Payment Terms:</strong> {selectedSupplier.payment_terms}</p>
                  )}
                  {selectedSupplier.notes && (
                    <p><strong>Notes:</strong> {selectedSupplier.notes}</p>
                  )}
                </div>

                <div className="supplier-stats">
                  <div className="stat-item">
                    <h4>Total Spent</h4>
                    <p className="stat-value">₱{(supplierPurchases?.totalSpent || 0).toFixed(2)}</p>
                  </div>
                  <div className="stat-item">
                    <h4>Products</h4>
                    <p className="stat-value">{supplierProducts.length}</p>
                  </div>
                  <div className="stat-item">
                    <h4>Purchases</h4>
                    <p className="stat-value">{supplierPurchases?.purchases?.length || 0}</p>
                  </div>
                </div>

                {supplierProducts.length > 0 && (
                  <div className="products-section">
                    <h3>Products from this Supplier</h3>
                    <div className="products-list">
                      {supplierProducts.map(product => (
                        <div key={product.id} className="product-item">
                          <span>{product.name}</span>
                          <span>Cost: ₱{parseFloat(product.cost_price).toFixed(2)}</span>
                          <span>Selling: ₱{parseFloat(product.selling_price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Suppliers List */}
        {loading ? (
          <div className="loading">Loading suppliers...</div>
        ) : (
          <>
            {suppliers.length === 0 ? (
              <div className="empty-state">No suppliers found. Add your first supplier!</div>
            ) : (
              <div className="suppliers-grid">
                {suppliers.map(supplier => (
                  <div key={supplier.id} className="supplier-card">
                    <h3>{supplier.name}</h3>
                    {supplier.contact_person && (
                      <p className="contact-info"><strong>Contact:</strong> {supplier.contact_person}</p>
                    )}
                    {supplier.phone && (
                      <p className="contact-info"><strong>Phone:</strong> {supplier.phone}</p>
                    )}
                    {supplier.email && (
                      <p className="contact-info"><strong>Email:</strong> {supplier.email}</p>
                    )}
                    <div className="supplier-actions">
                      <button onClick={() => handleViewDetails(supplier)} className="btn btn-sm btn-secondary">View Details</button>
                      <button onClick={() => handleEdit(supplier)} className="btn btn-sm btn-edit">Edit</button>
                      <button onClick={() => handleDelete(supplier.id, supplier.name)} className="btn btn-sm btn-delete">Delete</button>
                    </div>
                  </div>
                ))}
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

        <AdminAuthDialog
          show={showAdminAuth}
          onClose={handleAdminAuthClose}
          onConfirm={handleAdminAuthConfirm}
          message={`Please enter admin credentials to delete supplier "${supplierToDelete?.name}". This action cannot be undone.`}
        />
      </div>
    </UserLayout>
  );
};

export default SupplierManagement;
