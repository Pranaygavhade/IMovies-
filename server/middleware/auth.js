const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

// Protect routes - verify Bearer token
const protectRoute = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 'Not authorized to access this route, token missing', 401);
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'imovies_super_secure_jwt_secret_key_2026_cinema_access'
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 'User no longer exists', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'User account has been deactivated', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Session token expired, please log in again', 401);
    }
    return sendError(res, 'Not authorized to access this route, invalid token', 401);
  }
};

// Grant access to specific roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(
        res,
        `User role '${req.user ? req.user.role : 'guest'}' is not authorized to perform this action`,
        403
      );
    }
    next();
  };
};

module.exports = {
  protectRoute,
  protect: protectRoute,
  authorizeRoles,
};
