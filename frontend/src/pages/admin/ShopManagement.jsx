import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToastContext } from '../../components/AppToast';
import { getAdminShops, createShop, updateShop, deleteShop, getShopUsers, createUser, updateUser, deleteUser } from '../../services/api';
import './ShopManagement.css';

const ShopManagement = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', category: '' });
  const [error, setError] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopUsers, setShopUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({ username: '', password: '', email: '', active: true });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null, title: '' });
  const { showToast } = useToastContext();

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      const response = await getAdminShops();
      setShops(response.data);
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingShop) {
        await updateShop(editingShop.id, formData);
      } else {
        await createShop(formData);
      }
      setShowForm(false);
      setEditingShop(null);
      setFormData({ name: '', description: '', category: '' });
      loadShops();
      showToast(editingShop ? 'Shop updated successfully' : 'Shop created successfully', 'success');
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving shop');
      showToast(error.response?.data?.message || 'Error saving shop', 'error');
    }
  };

  const handleEdit = (shop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name,
      description: shop.description || '',
      category: shop.category || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id, name) => {
    setConfirmDialog({
      show: true,
      title: 'Delete Shop',
      message: `Are you sure you want to delete "${name}"? This will also delete all products and sales associated with this shop. This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteShop(id);
          loadShops();
          setConfirmDialog({ show: false });
          showToast('Shop deleted successfully', 'success');
        } catch (error) {
          showToast(error.response?.data?.message || 'Error deleting shop', 'error');
          setConfirmDialog({ show: false });
        }
      },
      confirmText: 'Delete',
      danger: true
    });
  };

  const handleManageUsers = async (shop) => {
    setSelectedShop(shop);
    try {
      const response = await getShopUsers(shop.id);
      setShopUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      setShopUsers([]);
    }
  };

  const handleCloseUsers = () => {
    setSelectedShop(null);
    setShopUsers([]);
    setShowUserForm(false);
    setEditingUser(null);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingUser) {
        await updateUser(editingUser.id, userFormData);
      } else {
        await createUser({
          ...userFormData,
          shop_id: selectedShop.id
        });
      }
      setShowUserForm(false);
      setEditingUser(null);
      setUserFormData({ username: '', password: '', email: '', active: true });
      handleManageUsers(selectedShop); // Reload users
      showToast(editingUser ? 'User updated successfully' : 'User created successfully', 'success');
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving user');
      showToast(error.response?.data?.message || 'Error saving user', 'error');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      password: '', // Don't show password
      email: user.email || '',
      active: user.active
    });
    setShowUserForm(true);
  };

  const handleDeleteUser = (id, username) => {
    setConfirmDialog({
      show: true,
      title: 'Delete User',
      message: `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteUser(id);
          handleManageUsers(selectedShop); // Reload users
          setConfirmDialog({ show: false });
          showToast('User deleted successfully', 'success');
        } catch (error) {
          showToast(error.response?.data?.message || 'Error deleting user', 'error');
          setConfirmDialog({ show: false });
        }
      },
      confirmText: 'Delete',
      danger: true
    });
  };

  return (
    <div className="shop-management">
      <header className="page-header">
        <h1>Shop Management</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary">
            ← Back to Dashboard
          </button>
          <button onClick={logout} className="btn btn-secondary">Logout</button>
        </div>
      </header>

      <div className="page-content">
        <div className="content-header">
          <h2>All Shops</h2>
          <button onClick={() => { setShowForm(true); setEditingShop(null); setFormData({ name: '', description: '', category: '' }); }} className="btn btn-primary">
            + Add New Shop
          </button>
        </div>

        {showForm && (
          <div className="form-overlay">
            <div className="form-container">
              <h2>{editingShop ? 'Edit Shop' : 'Add New Shop'}</h2>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Shop Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    <option value="MotorShop">MotorShop</option>
                    <option value="VapeShop">VapeShop</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingShop ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingShop(null); }} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div>Loading shops...</div>
        ) : (
          <div className="shops-grid">
            {shops.map(shop => (
              <div key={shop.id} className="shop-card">
                <h3>{shop.name}</h3>
                <p className="shop-category">{shop.category || 'No category'}</p>
                {shop.description && <p className="shop-description">{shop.description}</p>}
                <div className="shop-stats">
                  <span>{shop.productCount || 0} Products</span>
                  <span>{shop.saleCount || 0} Sales</span>
                </div>
                <div className="shop-actions">
                  <button onClick={() => handleEdit(shop)} className="btn btn-sm btn-edit">Edit</button>
                  <button onClick={() => handleManageUsers(shop)} className="btn btn-sm btn-users">Users</button>
                  <button onClick={() => handleDelete(shop.id, shop.name)} className="btn btn-sm btn-delete">Delete</button>
                </div>
              </div>
            ))}
            {shops.length === 0 && <p>No shops found. Create your first shop!</p>}
          </div>
        )}
      </div>

      {/* Users Management Modal */}
      {selectedShop && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Users for {selectedShop.name}</h2>
              <button onClick={handleCloseUsers} className="close-btn">&times;</button>
            </div>

            <div className="modal-content">
              <div className="content-header">
                <h3>Shop Users</h3>
                <button 
                  onClick={() => { setShowUserForm(true); setEditingUser(null); setUserFormData({ username: '', password: '', email: '', active: true }); }}
                  className="btn btn-primary"
                >
                  + Add User
                </button>
              </div>

              {showUserForm && (
                <div className="form-section">
                  <h4>{editingUser ? 'Edit User' : 'Add New User'}</h4>
                  {error && <div className="error-message">{error}</div>}
                  <form onSubmit={handleUserSubmit}>
                    <div className="form-group">
                      <label>Username *</label>
                      <input
                        type="text"
                        value={userFormData.username}
                        onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                        required
                        disabled={!!editingUser}
                      />
                    </div>
                    <div className="form-group">
                      <label>Password {editingUser ? '(leave empty to keep current)' : '*'}</label>
                      <input
                        type="password"
                        value={userFormData.password}
                        onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                        required={!editingUser}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={userFormData.active}
                          onChange={(e) => setUserFormData({ ...userFormData, active: e.target.checked })}
                        />
                        Active
                      </label>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">
                        {editingUser ? 'Update' : 'Create'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setShowUserForm(false); setEditingUser(null); setError(''); }} 
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="users-list">
                {shopUsers.length === 0 ? (
                  <p>No users for this shop. Add a user to get started.</p>
                ) : (
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shopUsers.map(user => (
                        <tr key={user.id}>
                          <td>{user.username}</td>
                          <td>{user.email || '-'}</td>
                          <td>
                            <span className={`status-badge ${user.active ? 'active' : 'inactive'}`}>
                              {user.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => handleEditUser(user)} className="btn btn-sm btn-edit">Edit</button>
                            <button onClick={() => handleDeleteUser(user.id, user.username)} className="btn btn-sm btn-delete">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopManagement;
