const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { isDeletedUser, normalizeUserRole } = require('../accountLifecycle');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 验证JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token is required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (isDeletedUser(user)) {
      return res.status(403).json({ message: '账号已注销' });
    }

    req.user = user;
    req.userRole = normalizeUserRole(user.role);
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const requireRoles = (...roles) => (req, res, next) => {
  const normalizedRoles = roles.map(normalizeUserRole);
  const currentRole = req.userRole || normalizeUserRole(req.user?.role);

  if (!normalizedRoles.includes(currentRole)) {
    return res.status(403).json({ message: '无权限访问' });
  }

  next();
};

const requireAdmin = requireRoles('admin', 'super_admin');
const requireSuperAdmin = requireRoles('super_admin');

// 生成JWT token
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role: normalizeUserRole(role) }, JWT_SECRET, { expiresIn: '24h' });
};

module.exports = {
  authenticateToken,
  requireRoles,
  requireAdmin,
  requireSuperAdmin,
  generateToken
};