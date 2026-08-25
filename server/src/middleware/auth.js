import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import config from '../config/index.js';
import redis from '../config/redis.js';
import { runWithTenant } from '../utils/TenantContext.js';

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
  let isBlacklisted = false;
  try {
    isBlacklisted = await redis.get(`bl_${token}`);
  } catch (err) {
    // Redis offline fallback
  }
  if (isBlacklisted) {
    throw ApiError.unauthorized('Token has been revoked. Please login again.');
  }

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Session expired. Please login again.');
    }
    throw ApiError.unauthorized('Invalid token. Please login again.');
  }

  // Look up user globally (bypassing tenant filter so we can authenticate them)
  let user = await runWithTenant(null, true, async () => {
    let cachedUser = null;
    try {
      cachedUser = await redis.get(`user_${decoded.id}`);
    } catch (err) {
      // Redis offline fallback
    }
    if (!cachedUser) {
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.id },
      });
      if (dbUser) {
        const { password, ...userClean } = dbUser;
        userClean._id = userClean.id; // Compatibility shim
        // Cache for 5 minutes
        try {
          await redis.set(`user_${decoded.id}`, userClean, 300);
        } catch (err) {
          // Redis offline fallback
        }
        return userClean;
      }
      return null;
    }
    return cachedUser;
  });

  if (!user) {
    throw ApiError.unauthorized('User not found. Account may have been deleted.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Account has been deactivated. Contact support.');
  }

  // Cross-tenant access validation: Ensure tenant-scoped user belongs to the active tenant
  if (
    user.role !== 'super_admin' &&
    user.tenantId &&
    req.tenantId &&
    user.tenantId.toString() !== req.tenantId
  ) {
    throw ApiError.forbidden('Access denied. You do not belong to this institute.');
  }

  req.user = user;
  req.userId = user.id || user._id?.toString();
  next();
});

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const userRole = req.user.role;

    // super_admin has unrestricted access to all endpoints
    if (userRole === 'super_admin') {
      return next();
    }

    // Direct role match
    if (roles.includes(userRole)) {
      return next();
    }

    // admin satisfies teacher / student / admin permissions
    if (
      userRole === 'admin' &&
      (roles.includes('admin') || roles.includes('teacher') || roles.includes('student'))
    ) {
      return next();
    }

    throw ApiError.forbidden(`Role '${userRole}' is not authorized to access this resource`);
  };
};

export const optionalAuth = catchAsync(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.match(/^Bearer\s+/i)) {
    token = authHeader.replace(/^Bearer\s+/i, '');
  }

  if (token) {
    try {
      let decoded = null;
      try {
        decoded = jwt.verify(token, config.jwt.secret);
      } catch {
        decoded = jwt.decode(token);
      }

      if (decoded && decoded.id) {
        let user = null;
        try {
          user = await redis.get(`user_${decoded.id}`);
        } catch {}
        if (!user) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: decoded.id },
            });
            if (dbUser && dbUser.isActive) {
              const { password, ...userClean } = dbUser;
              userClean._id = userClean.id;
              user = userClean;
            }
          } catch {}
        }

        const finalUser = user || {
          id: decoded.id,
          role: decoded.role || 'student',
          _id: decoded.id,
        };
        req.user = finalUser;
        req.userId = finalUser.id;
      }
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }

  next();
});

// Shorthand middleware
export const protect = authenticate;
export const adminOnly = [authenticate, authorize('admin', 'super_admin')];
export const teacherOnly = [authenticate, authorize('teacher', 'admin', 'super_admin')];
export const studentOnly = [authenticate, authorize('student', 'admin')];
export const superAdminOnly = [authenticate, authorize('super_admin')];
export const instituteAdminOnly = [authenticate, authorize('admin')];
