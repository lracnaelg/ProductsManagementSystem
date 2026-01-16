import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/AppToast';
import LoginSelection from './pages/LoginSelection';
import AdminLogin from './pages/AdminLogin';
import UserShopSelection from './pages/UserShopSelection';
import AdminDashboard from './pages/admin/AdminDashboard';
import ShopManagement from './pages/admin/ShopManagement';
import ShopSelection from './pages/ShopSelection';
import UserDashboard from './pages/user/UserDashboard';
import ProductManagement from './pages/user/ProductManagement';
import SupplierManagement from './pages/user/SupplierManagement';
import PurchaseManagement from './pages/user/PurchaseManagement';
import SalesManagement from './pages/user/SalesManagement';
import FinancialAnalytics from './pages/user/FinancialAnalytics';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
        <Routes>
          <Route path="/" element={<LoginSelection />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/user/shops" element={<UserShopSelection />} />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/shops" 
            element={
              <ProtectedRoute role="admin">
                <ShopManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* User Routes - No shop switching, users go directly to their shop */}
          <Route 
            path="/dashboard/:shopId" 
            element={
              <ProtectedRoute role="user">
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/products/:shopId" 
            element={
              <ProtectedRoute role="user">
                <ProductManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/suppliers/:shopId" 
            element={
              <ProtectedRoute role="user">
                <SupplierManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/purchases/:shopId" 
            element={
              <ProtectedRoute role="user">
                <PurchaseManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sales/:shopId" 
            element={
              <ProtectedRoute role="user">
                <SalesManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics/:shopId" 
            element={
              <ProtectedRoute role="user">
                <FinancialAnalytics />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
