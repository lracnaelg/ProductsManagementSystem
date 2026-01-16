import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getShops } from '../services/api';
import './ShopSelection.css';

const ShopSelection = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      const response = await getShops();
      setShops(response.data);
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShopSelect = (shopId) => {
    navigate(`/dashboard/${shopId}`);
  };

  return (
    <div className="shop-selection">
      <header className="page-header">
        <h1>Select a Shop</h1>
        <button onClick={logout} className="btn btn-secondary">Logout</button>
      </header>

      <div className="page-content">
        {loading ? (
          <div>Loading shops...</div>
        ) : (
          <div className="shops-grid">
            {shops.map(shop => (
              <div 
                key={shop.id} 
                className="shop-card"
                onClick={() => handleShopSelect(shop.id)}
              >
                <div className="shop-icon">🏪</div>
                <h2>{shop.name}</h2>
                {shop.category && <p className="shop-category">{shop.category}</p>}
                {shop.description && <p className="shop-description">{shop.description}</p>}
                <button className="btn btn-primary">Select Shop</button>
              </div>
            ))}
            {shops.length === 0 && <p>No shops available. Please contact admin.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopSelection;
