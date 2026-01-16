import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export const requireUser = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'user') {
    return res.status(403).json({ message: 'User access required' });
  }
  next();
};

// Middleware to ensure user can only access their own shop
export const requireShopAccess = (req, res, next) => {
  // Admins can access any shop
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Regular users must belong to the shop they're trying to access
  const shopId = req.params.shopId || req.body.shop_id || req.query.shop_id;
  
  if (!shopId) {
    return res.status(400).json({ message: 'Shop ID is required' });
  }
  
  // shop_id is stored in the JWT token (set during login)
  if (req.user.shop_id && parseInt(req.user.shop_id) !== parseInt(shopId)) {
    return res.status(403).json({ message: 'Access denied: You do not have access to this shop' });
  }
  
  next();
};
