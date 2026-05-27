import jwt from 'jsonwebtoken';
import { runWithTenant } from '../utils/TenantContext.js';
import Institute from '../modules/institute/institute.model.ts';
import SubscriptionPlan from '../modules/subscription/subscriptionPlan.model.ts';
import { Types } from 'mongoose';
import User from '../modules/user/user.model.ts';
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
      // Fetch from DB
      tenant = await Institute.findById(tenantIdHeader).lean();
      if (!tenant) {
        // Ensure a starter subscription plan exists
        let plan = await SubscriptionPlan.findOne({ name: 'starter' });
        if (!plan) {
          plan = await SubscriptionPlan.create({
            name: 'starter',
            price: 0,
            studentLimit: 100,
            teacherLimit: 5,
            storageLimit: 10 * 1024 * 1024 * 1024,
            features: [],
          });
        }
        // Create a dummy admin user for the institute owner
        const dummyOwnerEmail = `auto-owner-${tenantIdHeader}@example.com`;
        const existingOwner = await User.findOne({ email: dummyOwnerEmail });
        const ownerId = existingOwner
          ? existingOwner._id
          : (
              await User.create({
                name: 'Auto Owner',
                email: dummyOwnerEmail,
                password: 'TempPass123!',
                role: 'admin',
                tenantId: tenantIdHeader,
                isEmailVerified: true,
              })
            )._id;

        tenant = (
          await Institute.create({
            _id: new Types.ObjectId(tenantIdHeader),
            name: 'Auto-Created Institute',
            subdomain: `auto-${tenantIdHeader}`,
            isActive: true,
            owner: ownerId,
            subscription: {
              plan: plan._id,
              status: 'active',
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
            limits: { studentLimit: 1000, teacherLimit: 100, storageLimit: 10_737_418_240 },
          })
        ).toObject();
      }
      // Cache the result (whether newly created or fetched)
      await setTenantCache(`id:${tenantIdHeader}`, tenant);
    }
  } else if (subdomain) {
    const sub = subdomain.toLowerCase();
    tenant = await getTenantFromCache(`subdomain:${sub}`);
    if (!tenant) {
      tenant = await Institute.findOne({ subdomain: sub }).lean();
      if (tenant) await setTenantCache(`subdomain:${sub}`, tenant);
    }
  }

  // Fallback: derive tenant from the authenticated user's tenantId in JWT
  if (!tenant) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], config.jwt.secret);
        if (decoded.id) {
          const user = await runWithTenant(null, true, () =>
            User.findById(decoded.id).select('tenantId role').lean()
          );
          if (user?.tenantId && user.role !== 'super_admin') {
            const tid = user.tenantId.toString();
            tenant = await getTenantFromCache(`id:${tid}`);
            if (!tenant) {
              tenant = await Institute.findById(tid).lean();
              if (tenant) await setTenantCache(`id:${tid}`, tenant);
            }
          }
        }
      } catch {
        // Invalid/expired token — auth middleware will handle it
      }
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
