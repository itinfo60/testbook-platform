import { runWithTenant } from '../utils/TenantContext.js';
import Institute from '../modules/institute/institute.model.js';
import User from '../modules/user/user.model.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import redis from '../config/redis.js';

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
    tenant = await getTenantFromCache(`id:${tenantIdHeader}`);
    if (!tenant) {
      tenant = await Institute.findById(tenantIdHeader).lean();
      if (tenant) await setTenantCache(`id:${tenantIdHeader}`, tenant);
    }
  } else if (subdomain) {
    const sub = subdomain.toLowerCase();
    tenant = await getTenantFromCache(`subdomain:${sub}`);
    if (!tenant) {
      tenant = await Institute.findOne({ subdomain: sub }).lean();
      if (tenant) await setTenantCache(`subdomain:${sub}`, tenant);
    }
  }

  if (tenant) {
    // 1. Verify active status
    if (!tenant.isActive) {
      throw ApiError.forbidden('This institute has been suspended. Please contact support.');
    }

    // 2. Verify subscription status
    if (tenant.subscription.status === 'suspended') {
      throw ApiError.forbidden(
        'This institute has been suspended due to billing. Please contact support.'
      );
    }

    const now = new Date();
    const expiresAt = new Date(tenant.subscription.expiresAt);
    const gracePeriodEnd = new Date(expiresAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7-day grace
    if (tenant.subscription.status === 'expired' || (now > expiresAt && now > gracePeriodEnd)) {
      // Automatically update status to expired in background (non-blocking)
      if (tenant.subscription.status !== 'expired') {
        setImmediate(() =>
          Institute.findByIdAndUpdate(tenant._id, { 'subscription.status': 'expired' }).catch(
            () => {}
          )
        );
        invalidateTenantCache(tenant.subdomain, tenant._id.toString()).catch(() => {});
      }
      throw ApiError.forbidden(
        "This institute's subscription has expired. Please upgrade or renew your plan."
      );
    }

    // Bind to request
    req.tenantId = tenant._id.toString();
    req.tenant = tenant;

    // Run request within the tenant context (filtering queries to tenantId)
    return runWithTenant(tenant._id.toString(), false, next);
  }

  // No tenant identified - run in bypass mode (useful for Super Admin, global endpoints)
  return runWithTenant(null, true, next);
});

/**
 * Middleware to require a valid tenant context.
 */
export const requireTenant = (req, res, next) => {
  if (!req.tenantId) {
    throw ApiError.badRequest(
      'Tenant context required. Please use an institute subdomain or specify X-Tenant-Subdomain / X-Tenant-Id header.'
    );
  }
  next();
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

  const studentCount = await User.countDocuments({ role: 'student', tenantId: req.tenantId });
  if (studentCount >= req.tenant.limits.studentLimit) {
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

  const teacherCount = await User.countDocuments({ role: 'teacher', tenantId: req.tenantId });
  if (teacherCount >= req.tenant.limits.teacherLimit) {
    throw ApiError.forbidden(
      'The teacher limit for this institute has been reached. Please contact administration to upgrade.'
    );
  }
  next();
});
