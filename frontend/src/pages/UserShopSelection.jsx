import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getShops } from '../services/api';
import './UserShopSelection.css';
import './Login.css';

const UserShopSelection = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      // Get shops without authentication (public endpoint needed)
      const response = await getShops();
      setShops(response.data);
    } catch (error) {
      console.error('Error loading shops:', error);
      // If it requires auth, we'll need to adjust
    } finally {
      setLoading(false);
    }
  };

  const handleShopSelect = (shop) => {
    setSelectedShop(shop);
    setShowLogin(true);
  };

  const handleBackToShops = () => {
    setSelectedShop(null);
    setShowLogin(false);
  };

  if (showLogin && selectedShop) {
    return <UserLogin shop={selectedShop} onBack={handleBackToShops} />;
  }

  return (
    <div className="user-shop-selection">
      <div className="selection-container">
        <h1>Select Your Shop</h1>
        <p className="subtitle">Choose the shop you want to access</p>
        
        {loading ? (
          <div>Loading shops...</div>
        ) : (
          <div className="shops-grid">
            {shops.map(shop => (
              <div 
                key={shop.id} 
                className="shop-card"
                onClick={() => handleShopSelect(shop)}
              >
                <div className="shop-icon">🏪</div>
                <h2>{shop.name}</h2>
                {shop.category && <p className="shop-category">{shop.category}</p>}
                {shop.description && <p className="shop-description">{shop.description}</p>}
                <button className="btn btn-primary">Select & Login</button>
              </div>
            ))}
            {shops.length === 0 && (
              <p className="no-shops">No shops available. Please contact admin.</p>
            )}
          </div>
        )}
        
        <Link to="/" className="back-link">← Back to Selection</Link>
      </div>
    </div>
  );
};

// UserLogin component (moved here for shop-specific login)
const UserLogin = ({ shop, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Login with shopId
      const result = await login(username, password, false, shop.id);
      
      if (result.success) {
        navigate(`/dashboard/${shop.id}`);
      } else {
        setError(result.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Login to {shop.name}</h1>
        <p className="subtitle">Enter your credentials for this shop</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <button type="button" onClick={onBack} className="back-link">← Back to Shop Selection</button>
      </div>
    </div>
  );
};

export default UserShopSelection;
