import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import UserLayout from '../../components/UserLayout';
import { getDashboardMetrics } from '../../services/api';
import './UserDashboard.css';

const UserDashboard = () => {
  const { shopId } = useParams();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [shopId]);

  const loadData = async () => {
    try {
      const response = await getDashboardMetrics(shopId);
      setMetrics(response.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <UserLayout activeTab="dashboard">
      <div className="user-dashboard">
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Today's Revenue</h3>
            <p className="metric-value">₱{metrics?.today?.revenue?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="metric-card">
            <h3>Today's Profit</h3>
            <p className="metric-value">₱{metrics?.today?.profit?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="metric-card">
            <h3>Today's Transactions</h3>
            <p className="metric-value">{metrics?.today?.transactions || 0}</p>
          </div>
          <div className="metric-card">
            <h3>Inventory Value</h3>
            <p className="metric-value">₱{metrics?.inventoryValue || '0.00'}</p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserDashboard;
