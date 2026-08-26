import jwt from 'jsonwebtoken';
import { runWithTenant } from '../utils/TenantContext.js';
import { prisma } from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import redis from '../config/redis.js';
import config from '../config/index.js';

const TENANT_CACHE_TTL = 300; // 5 minutes

async function getTenantFromCache(key) {
  return redis.get(`tenant:${key}`);
}

async function setTenantCache(key, tenant) {
  await redis.set(`tenant:${key}`, tenant, TENANT_CACHE_TTL);
}

export async function invalidateTenantCache(subdomain, id) {
  await Promise.all([redis.del(`tenant:subdomain:${subdomain}`), redis.del(`tenant:id:${id}`)]);
}

/**
 * Extracts the tenant subdomain from the hostname.
 * E.g., "abc.localhost" -> "abc", "abc.platform.com" -> "abc"
 */
const getSubdomain = (host) => {
  if (!host) return null;
  const hostName = host.split(':')[0];
  const parts = hostName.split('.');

  if (hostName.endsWith('localhost') || hostName.endsWith('127.0.0.1')) {
    if (parts.length > 1 && parts[0] !== 'localhost') {
      return parts[0];
    }
    return null;
  }

  // Production domain check: e.g. abc.platform.com
  if (parts.length > 2) {
    if (parts[0] === 'www') {
      return parts[1];
    }
    return parts[0];
  }

  return null;
};

/**
 * Global middleware to identify tenant and bind context.
 */
export const tenantIdentification = catchAsync(async (req, res, next) => {
  // Extract subdomain or explicit headers
  const subdomain = getSubdomain(req.headers.host) || req.headers['x-tenant-subdomain'];
  const tenantIdHeader = req.headers['x-tenant-id'];

  let tenant = null;

  if (tenantIdHeader) {
    // Try cache first
    tenant = await getTenantFromCache(`id:${tenantIdHeader}`);
    if (!tenant) {
      // Fetch from DB via Prisma
      tenant = await prisma.institute.findUnique({
        where: { id: tenantIdHeader },
      });
      if (!tenant) {
        // If tenant not found, return error - do not auto-create
        return res.status(404).json({ success: false, message: 'Institute not found' });
      }
      tenant._id = tenant.id;
      // Cache the result
      await setTenantCache(`id:${tenantIdHeader}`, tenant);
    }
  } else if (subdomain) {
    const sub = subdomain.toLowerCase();
    tenant = await getTenantFromCache(`subdomain:${sub}`);
    if (!tenant) {
      tenant = await prisma.institute.findUnique({
        where: { subdomain: sub },
      });
      if (tenant) {
        tenant._id = tenant.id;
        await setTenantCache(`subdomain:${sub}`, tenant);
      }
    }
  }

  // Extract from authenticated user token if not resolved by domain/header
  if (!tenant) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.decode(token);
        if (decoded && decoded.id) {
          if (decoded.role === 'super_admin' || decoded.role === 'admin') {
            // Admin accounts can operate globally
            return runWithTenant(null, true, next);
          }
          const user = await runWithTenant(null, true, () =>
            prisma.user.findUnique({
              where: { id: decoded.id },
              select: { id: true, role: true, tenantId: true },
            })
          );
          if (user?.tenantId && user.role !== 'super_admin') {
            const tid = user.tenantId.toString();
            tenant = await getTenantFromCache(`id:${tid}`);
            if (!tenant) {
              tenant = await prisma.institute.findUnique({
                where: { id: tid },
              });
              if (tenant) {
                tenant._id = tenant.id;
                await setTenantCache(`id:${tid}`, tenant);
              }
            }
          }
        }
      } catch {
        // Invalid/expired token — auth middleware will handle it
      }
    }
  }

  // Fallback to default active institute for apex/custom domains (e.g. civicsedu.com)
  if (!tenant) {
    tenant = await getTenantFromCache('default_institute');
    if (!tenant) {
      tenant = await prisma.institute.findFirst({
        where: { isActive: true },
      });
      if (tenant) {
        tenant._id = tenant.id;
        await setTenantCache('default_institute', tenant);
      }
    }
  }

  if (tenant) {
    tenant._id = tenant.id;
    // 1. Verify active status
    if (tenant.isActive === false) {
      throw ApiError.forbidden('This institute has been suspended. Please contact support.');
    }

    // 2. Verify subscription status
    if (tenant.subscription && typeof tenant.subscription === 'object') {
      if (tenant.subscription.status === 'suspended') {
        throw ApiError.forbidden(
          'This institute has been suspended due to billing. Please contact support.'
        );
      }

      if (tenant.subscription.expiresAt) {
        const now = new Date();
        const expiresAt = new Date(tenant.subscription.expiresAt);
        const gracePeriodEnd = new Date(expiresAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7-day grace
        if (tenant.subscription.status === 'expired' || (now > expiresAt && now > gracePeriodEnd)) {
          // Automatically update status to expired in background (non-blocking)
          if (tenant.subscription.status !== 'expired') {
            setImmediate(() =>
              prisma.institute
                .update({
                  where: { id: tenant.id },
                  data: {
                    subscription: {
                      ...tenant.subscription,
                      status: 'expired',
                    },
                  },
                })
                .catch(() => {})
            );
            invalidateTenantCache(tenant.subdomain, tenant.id).catch(() => {});
          }
          throw ApiError.forbidden(
            "This institute's subscription has expired. Please upgrade or renew your plan."
          );
        }
      }
    }

    // Bind to request
    req.tenantId = tenant.id;
    req.tenant = tenant;

    // Run request within the tenant context (filtering queries to tenantId)
    return runWithTenant(tenant.id, false, next);
  }

  // No tenant identified - run in bypass mode (useful for Super Admin, global endpoints)
  return runWithTenant(null, true, next);
});

/**
 * Middleware to require a valid tenant context.
 */
export const requireTenant = (req, res, next) => {
  if (req.tenantId) return next();
  if (req.user?.role === 'super_admin' || req.user?.role === 'admin') return next();

  if (req.headers.authorization) {
    try {
      const token = req.headers.authorization.replace('Bearer ', '');
      const decoded = jwt.decode(token);
      if (decoded?.role === 'super_admin' || decoded?.role === 'admin') {
        return next();
      }
    } catch {}
  }

  throw ApiError.badRequest(
    'Tenant context required. Please use an institute subdomain or specify X-Tenant-Subdomain / X-Tenant-Id header.'
  );
};

/**
 * Middleware that identifies a tenant when present but does NOT block the
 * request when no tenant is resolved. Use this for public browse/catalog routes
 * that work both globally and within a tenant context.
 */
export const optionalTenant = (req, _res, next) => {
  // tenantIdentification already ran — just pass through regardless of result
  next();
};

/**
 * Middleware to enforce student registration limit.
 */
export const checkStudentLimit = catchAsync(async (req, res, next) => {
  if (!req.tenant) return next();

  const studentCount = await prisma.user.count({
    where: { role: 'student', tenantId: req.tenantId },
  });
  const limit = req.tenant.limits?.studentLimit;
  if (limit && studentCount >= limit) {
    throw ApiError.forbidden(
      'The student limit for this institute has been reached. Please contact administration to upgrade.'
    );
  }
  next();
});

/**
 * Middleware to enforce teacher registration limit.
 */
export const checkTeacherLimit = catchAsync(async (req, res, next) => {
  if (!req.tenant) return next();

  const teacherCount = await prisma.user.count({
    where: { role: 'teacher', tenantId: req.tenantId },
  });
  const limit = req.tenant.limits?.teacherLimit;
  if (limit && teacherCount >= limit) {
    throw ApiError.forbidden(
      'The teacher limit for this institute has been reached. Please contact administration to upgrade.'
    );
  }
  next();
});

/**
 * Middleware to enforce storage limit before file upload.
 * Reads Content-Length from the request to estimate usage.
 */
export const checkStorageLimit = catchAsync(async (req, res, next) => {
  if (!req.tenant) return next();

  const incomingBytes = parseInt(req.headers['content-length'] || '0', 10);
  const { storageUsed = 0, limits } = req.tenant;
  const storageLimit = limits?.storageLimit || 10 * 1024 * 1024 * 1024; // 10 GB default

  if (storageUsed + incomingBytes > storageLimit) {
    const usedGB = (storageUsed / 1024 ** 3).toFixed(2);
    const limitGB = (storageLimit / 1024 ** 3).toFixed(0);
    throw ApiError.forbidden(
      `Storage limit reached (${usedGB} GB used of ${limitGB} GB). Please delete old files or upgrade your plan.`
    );
  }
  next();
});
