import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getShop } from '../services/api';
import './UserLayout.css';

const UserLayout = ({ children, activeTab }) => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShop();
  }, [shopId]);

  const loadShop = async () => {
    try {
      const response = await getShop(shopId);
      setShop(response.data);
    } catch (error) {
      console.error('Error loading shop:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="user-layout">
      <header className="page-header">
        <h1>{shop?.name || 'Dashboard'}</h1>
        <div className="header-actions">
          <button onClick={logout} className="btn btn-secondary">Logout</button>
        </div>
      </header>

      <nav className="main-nav">
        <button 
          onClick={() => navigate(`/dashboard/${shopId}`)} 
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          Dashboard
        </button>
        <button 
          onClick={() => navigate(`/products/${shopId}`)} 
          className={`nav-btn ${activeTab === 'products' ? 'active' : ''}`}
        >
          Products
        </button>
        <button 
          onClick={() => navigate(`/sales/${shopId}`)} 
          className={`nav-btn ${activeTab === 'sales' ? 'active' : ''}`}
        >
          Sales
        </button>
        <button 
          onClick={() => navigate(`/purchases/${shopId}`)} 
          className={`nav-btn ${activeTab === 'purchases' ? 'active' : ''}`}
        >
          Purchases
        </button>
        <button 
          onClick={() => navigate(`/suppliers/${shopId}`)} 
          className={`nav-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
        >
          Suppliers
        </button>
        <button 
          onClick={() => navigate(`/analytics/${shopId}`)} 
          className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
        >
          Analytics
        </button>
      </nav>

      <div className="page-content">
        {children}
      </div>
    </div>
  );
};

export default UserLayout;
