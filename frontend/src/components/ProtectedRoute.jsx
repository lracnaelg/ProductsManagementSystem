import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, isAdmin, isUser, loading, user } = useAuth();
  const { shopId } = useParams();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (role === 'admin' && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (role === 'user' && !isUser && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // For user routes with shopId, validate that user belongs to that shop
  if (role === 'user' && shopId && user && !isAdmin) {
    // If user doesn't have a shop_id or it doesn't match, redirect
    if (!user.shop_id || parseInt(user.shop_id) !== parseInt(shopId)) {
      // Redirect to their own shop's dashboard if they have one
      if (user.shop_id) {
        return <Navigate to={`/dashboard/${user.shop_id}`} replace />;
      }
      // Otherwise, logout (they shouldn't be logged in without a shop)
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
