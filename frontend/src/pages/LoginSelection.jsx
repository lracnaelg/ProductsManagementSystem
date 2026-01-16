import { useNavigate } from 'react-router-dom';
import './LoginSelection.css';

const LoginSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="login-selection">
      <div className="login-selection-container">
        <h1>Product Management System</h1>
        <p className="subtitle">Select your login type</p>
        
        <div className="login-buttons">
          <button 
            className="login-btn admin-btn"
            onClick={() => navigate('/admin/login')}
          >
            <div className="btn-icon">👤</div>
            <div>
              <h2>Admin Login</h2>
              <p>Manage shops and system settings</p>
            </div>
          </button>
          
          <button 
            className="login-btn user-btn"
            onClick={() => navigate('/user/shops')}
          >
            <div className="btn-icon">🛍️</div>
            <div>
              <h2>User Login</h2>
              <p>Manage products, sales, and analytics</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginSelection;
