import axios from 'axios';

const API_BASE_URL = '/api';

// Auth APIs
export const login = async (username, password, isAdmin = false) => {
  const endpoint = isAdmin ? `${API_BASE_URL}/auth/admin/login` : `${API_BASE_URL}/auth/login`;
  return axios.post(endpoint, { username, password });
};

export const verifyToken = async () => {
  return axios.get(`${API_BASE_URL}/auth/verify`);
};

export const logout = async () => {
  return axios.post(`${API_BASE_URL}/auth/logout`);
};

// Shop APIs
export const getShops = async () => {
  return axios.get(`${API_BASE_URL}/shops`);
};

export const getShop = async (id) => {
  return axios.get(`${API_BASE_URL}/shops/${id}`);
};

// Admin Shop APIs
export const getAdminShops = async () => {
  return axios.get(`${API_BASE_URL}/admin/shops`);
};

export const createShop = async (shopData) => {
  return axios.post(`${API_BASE_URL}/admin/shops`, shopData);
};

export const updateShop = async (id, shopData) => {
  return axios.put(`${API_BASE_URL}/admin/shops/${id}`, shopData);
};

export const deleteShop = async (id) => {
  return axios.delete(`${API_BASE_URL}/admin/shops/${id}`);
};

// Admin User APIs
export const getShopUsers = async (shopId) => {
  return axios.get(`${API_BASE_URL}/admin/users/shop/${shopId}`);
};

export const getAllUsers = async () => {
  return axios.get(`${API_BASE_URL}/admin/users`);
};

export const createUser = async (userData) => {
  return axios.post(`${API_BASE_URL}/admin/users`, userData);
};

export const updateUser = async (id, userData) => {
  return axios.put(`${API_BASE_URL}/admin/users/${id}`, userData);
};

export const deleteUser = async (id) => {
  return axios.delete(`${API_BASE_URL}/admin/users/${id}`);
};

// Product APIs
export const getProducts = async (shopId, params = {}) => {
  return axios.get(`${API_BASE_URL}/products`, { params: { shopId, ...params } });
};

export const getProduct = async (id) => {
  return axios.get(`${API_BASE_URL}/products/${id}`);
};

export const createProduct = async (productData) => {
  return axios.post(`${API_BASE_URL}/products`, productData);
};

export const updateProduct = async (id, productData) => {
  return axios.put(`${API_BASE_URL}/products/${id}`, productData);
};

export const deleteProduct = async (id, adminUsername = null, adminPassword = null) => {
  const config = adminUsername && adminPassword ? {
    data: { adminUsername, adminPassword }
  } : {};
  return axios.delete(`${API_BASE_URL}/products/${id}`, config);
};

export const bulkUpdateProducts = async (productIds, updates) => {
  return axios.post(`${API_BASE_URL}/products/bulk-update`, { productIds, updates });
};

// Supplier APIs
export const getSuppliers = async (params = {}) => {
  return axios.get(`${API_BASE_URL}/suppliers`, { params });
};

export const getSupplier = async (id) => {
  return axios.get(`${API_BASE_URL}/suppliers/${id}`);
};

export const createSupplier = async (supplierData) => {
  return axios.post(`${API_BASE_URL}/suppliers`, supplierData);
};

export const updateSupplier = async (id, supplierData) => {
  return axios.put(`${API_BASE_URL}/suppliers/${id}`, supplierData);
};

export const deleteSupplier = async (id) => {
  return axios.delete(`${API_BASE_URL}/suppliers/${id}`);
};

export const getSupplierProducts = async (id) => {
  return axios.get(`${API_BASE_URL}/suppliers/${id}/products`);
};

export const getSupplierPurchases = async (id) => {
  return axios.get(`${API_BASE_URL}/suppliers/${id}/purchases`);
};

// Purchase APIs
export const getPurchases = async (params = {}) => {
  return axios.get(`${API_BASE_URL}/purchases`, { params });
};

export const getPurchase = async (id) => {
  return axios.get(`${API_BASE_URL}/purchases/${id}`);
};

export const createPurchase = async (purchaseData) => {
  return axios.post(`${API_BASE_URL}/purchases`, purchaseData);
};

// Sale APIs
export const getSales = async (params = {}) => {
  return axios.get(`${API_BASE_URL}/sales`, { params });
};

export const getSale = async (id) => {
  return axios.get(`${API_BASE_URL}/sales/${id}`);
};

export const createSale = async (saleData) => {
  return axios.post(`${API_BASE_URL}/sales`, saleData);
};

export const getSalesStats = async (params = {}) => {
  return axios.get(`${API_BASE_URL}/sales/stats/summary`, { params });
};

export const verifyAdminCredentials = async (username, password) => {
  return axios.post(`${API_BASE_URL}/auth/admin/verify`, { username, password });
};

export const deleteSale = async (id, adminUsername, adminPassword) => {
  return axios.delete(`${API_BASE_URL}/sales/${id}`, {
    data: { adminUsername, adminPassword }
  });
};

// Financial APIs
export const getDashboardMetrics = async (shopId) => {
  return axios.get(`${API_BASE_URL}/financial/dashboard`, { params: { shopId } });
};

export const getTrends = async (shopId, period = 'daily') => {
  return axios.get(`${API_BASE_URL}/financial/trends`, { params: { shopId, period } });
};

export const getMargins = async (shopId) => {
  return axios.get(`${API_BASE_URL}/financial/margins`, { params: { shopId } });
};

export const getGrossVsNet = async (shopId, startDate, endDate) => {
  return axios.get(`${API_BASE_URL}/financial/gross-vs-net`, { 
    params: { shopId, startDate, endDate } 
  });
};

// Export APIs
export const exportProducts = async (shopId) => {
  return axios.get(`${API_BASE_URL}/export/products`, { 
    params: { shopId },
    responseType: 'blob'
  });
};

export const exportSales = async (shopId, startDate, endDate) => {
  return axios.get(`${API_BASE_URL}/export/sales`, { 
    params: { shopId, startDate, endDate },
    responseType: 'blob'
  });
};

export const exportPurchases = async (shopId, startDate, endDate) => {
  return axios.get(`${API_BASE_URL}/export/purchases`, { 
    params: { shopId, startDate, endDate },
    responseType: 'blob'
  });
};
