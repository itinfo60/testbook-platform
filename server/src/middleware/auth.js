import jwt from 'jsonwebtoken';
import User from '../modules/user/user.model.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import config from '../config/index.js';
import redis from '../config/redis.js';

export const authenticate = catchAsync(async (req, res, next) => {
  let token;

  // Extract token from header or cookie
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw ApiError.unauthorized('Access token required. Please login.');
  }

  // Check if token is blacklisted
  const isBlacklisted = await redis.get(`bl_${token}`);
  if (isBlacklisted) {
    throw ApiError.unauthorized('Token has been revoked. Please login again.');
  }

  // Verify token
  const decoded = jwt.verify(token, config.jwt.secret);

  // Check cache first
  let user = await redis.get(`user_${decoded.id}`);
  
  if (!user) {
    user = await User.findById(decoded.id).select('-password -refreshTokens').lean();
    if (!user) {
      throw ApiError.unauthorized('User not found. Account may have been deleted.');
    }
    // Cache for 5 minutes
    await redis.set(`user_${decoded.id}`, user, 300);
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Account has been deactivated. Contact support.');
  }

  req.user = user;
  req.userId = user._id.toString();
  next();
});

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Role '${req.user.role}' is not authorized to access this resource`
      );
    }

    next();
  };
};

export const optionalAuth = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.id).select('-password -refreshTokens').lean();
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id.toString();
      }
    } catch {
      // Silently fail — user is anonymous
    }
  }

  next();
});

// Shorthand middleware
export const protect = authenticate;
export const adminOnly = [authenticate, authorize('admin', 'super_admin')];
export const teacherOnly = [authenticate, authorize('teacher', 'admin', 'super_admin')];
export const studentOnly = [authenticate, authorize('student', 'admin')];
