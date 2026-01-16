import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { getAdminShops } from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalShops: 0,
    totalProducts: 0,
    totalSales: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await getAdminShops();
      const shops = response.data;
      const totalShops = shops.length;
      const totalProducts = shops.reduce((sum, shop) => sum + (shop.productCount || 0), 0);
      const totalSales = shops.reduce((sum, shop) => sum + (shop.saleCount || 0), 0);
      
      setStats({ totalShops, totalProducts, totalSales });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-actions">
          <span>Welcome, {user?.username}</span>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Shops</h3>
            <p className="stat-value">{stats.totalShops}</p>
          </div>
          <div className="stat-card">
            <h3>Total Products</h3>
            <p className="stat-value">{stats.totalProducts}</p>
          </div>
          <div className="stat-card">
            <h3>Total Sales</h3>
            <p className="stat-value">{stats.totalSales}</p>
          </div>
        </div>

        <div className="quick-actions">
          <button 
            className="action-card"
            onClick={() => navigate('/admin/shops')}
          >
            <div className="action-icon">🏪</div>
            <h2>Manage Shops</h2>
            <p>Add, edit, or delete shops</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
