import { useState } from 'react';
import './AdminAuthDialog.css';

const AdminAuthDialog = ({ show, onClose, onConfirm, message = 'This action requires admin credentials.' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onConfirm(username, password);
      // Reset form on success
      setUsername('');
      setPassword('');
      setError('');
    } catch (err) {
      setError(err.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUsername('');
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="admin-auth-overlay">
      <div className="admin-auth-dialog">
        <h3>Admin Authentication Required</h3>
        <p className="admin-auth-message">{message}</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Admin Username *</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Admin Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="admin-auth-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Confirm'}
            </button>
            <button type="button" onClick={handleCancel} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAuthDialog;
