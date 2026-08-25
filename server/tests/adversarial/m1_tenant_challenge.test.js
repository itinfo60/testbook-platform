import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  tenantIdentification,
  requireTenant,
  optionalTenant,
  checkStudentLimit,
  checkTeacherLimit,
  checkStorageLimit,
  invalidateTenantCache,
} from '../../src/middleware/tenant.middleware.js';
import ApiError from '../../src/utils/ApiError.js';
import redis from '../../src/config/redis.js';
import config from '../../src/config/index.js';
import { prisma } from '../../src/config/prisma.js';

vi.mock('../../src/config/redis.js', () => ({
  default: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
  },
}));

vi.mock('../../src/config/prisma.js', () => ({
  prisma: {
    institute: {
      findUnique: vi.fn(),
      update: vi.fn().mockReturnValue({ catch: vi.fn() }),
    },
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('../../src/utils/TenantContext.js', () => ({
  runWithTenant: vi.fn((tenantId, bypass, cb) => cb()),
}));

import { runWithTenant } from '../../src/utils/TenantContext.js';

describe('Milestone 1 Adversarial Challenge: Tenant Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  const JWT_SECRET = config.jwt.secret;

  const validTenant = {
    id: 'inst-uuid-1',
    name: 'Apex Academy',
    subdomain: 'apex',
    isActive: true,
    subscription: {
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    limits: {
      studentLimit: 50,
      teacherLimit: 5,
      storageLimit: 5 * 1024 * 1024 * 1024, // 5 GB
    },
    storageUsed: 2 * 1024 * 1024 * 1024, // 2 GB
  };

  beforeEach(() => {
    mockReq = {
      headers: {},
      cookies: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
    runWithTenant.mockImplementation((tenantId, bypass, cb) => cb());
  });

  // =========================================================================
  // 1. Tenant Resolution Precedence: Header vs Subdomain vs JWT Context
  // =========================================================================
  describe('1. Tenant Resolution Precedence and Isolation', () => {
    it('should prioritize X-Tenant-Id header over subdomain and query DB when not cached', async () => {
      mockReq.headers['x-tenant-id'] = 'inst-uuid-1';
      mockReq.headers['x-tenant-subdomain'] = 'other-sub';

      redis.get.mockResolvedValueOnce(null); // cache miss
      prisma.institute.findUnique.mockResolvedValueOnce(validTenant);

      await tenantIdentification(mockReq, mockRes, mockNext);

      expect(prisma.institute.findUnique).toHaveBeenCalledWith({ where: { id: 'inst-uuid-1' } });
      expect(redis.set).toHaveBeenCalledWith(
        'tenant:id:inst-uuid-1',
        expect.objectContaining({ id: 'inst-uuid-1' }),
        300
      );
      expect(mockReq.tenantId).toBe('inst-uuid-1');
      expect(mockReq.tenant._id).toBe('inst-uuid-1');
      expect(runWithTenant).toHaveBeenCalledWith('inst-uuid-1', false, expect.any(Function));
    });

    it('should return 404 if X-Tenant-Id header is provided but institute does not exist in DB', async () => {
      mockReq.headers['x-tenant-id'] = 'non-existent-id';
      redis.get.mockResolvedValueOnce(null);
      prisma.institute.findUnique.mockResolvedValueOnce(null);

      await tenantIdentification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Institute not found',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should resolve tenant by X-Tenant-Subdomain header (lowercased) if X-Tenant-Id is absent', async () => {
      mockReq.headers['x-tenant-subdomain'] = 'APEX';
      redis.get.mockResolvedValueOnce(null);
      prisma.institute.findUnique.mockResolvedValueOnce(validTenant);

      await tenantIdentification(mockReq, mockRes, mockNext);

      expect(prisma.institute.findUnique).toHaveBeenCalledWith({ where: { subdomain: 'apex' } });
      expect(mockReq.tenantId).toBe('inst-uuid-1');
    });

    it('should resolve tenant from host header (e.g. apex.platform.com)', async () => {
      mockReq.headers.host = 'apex.platform.com';
      redis.get.mockResolvedValueOnce(null);
      prisma.institute.findUnique.mockResolvedValueOnce(validTenant);

      await tenantIdentification(mockReq, mockRes, mockNext);

      expect(prisma.institute.findUnique).toHaveBeenCalledWith({ where: { subdomain: 'apex' } });
      expect(mockReq.tenantId).toBe('inst-uuid-1');
    });

    it('should resolve tenant from www.apex.platform.com host header', async () => {
      mockReq.headers.host = 'www.apex.platform.com';
      redis.get.mockResolvedValueOnce(null);
      prisma.institute.findUnique.mockResolvedValueOnce(validTenant);

      await tenantIdentification(mockReq, mockRes, mockNext);

      expect(prisma.institute.findUnique).toHaveBeenCalledWith({ where: { subdomain: 'apex' } });
      expect(mockReq.tenantId).toBe('inst-uuid-1');
    });

    it('should fallback to authenticated user JWT tenantId when no headers/subdomains are present', async () => {
      const token = jwt.sign({ id: 'user-with-tenant' }, JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-with-tenant',
        role: 'student',
        tenantId: 'inst-uuid-1',
      });
      redis.get.mockResolvedValueOnce(null); // tenant not in cache
      prisma.institute.findUnique.mockResolvedValueOnce(validTenant);

      await tenantIdentification(mockReq, mockRes, mockNext);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-with-tenant' },
        select: { id: true, role: true, tenantId: true },
      });
      expect(mockReq.tenantId).toBe('inst-uuid-1');
      expect(mockReq.tenant).toEqual(expect.objectContaining({ id: 'inst-uuid-1' }));
    });

    it('should NOT fallback to tenant context if JWT user is super_admin', async () => {
      const token = jwt.sign({ id: 'super-admin' }, JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'super-admin',
        role: 'super_admin',
        tenantId: 'inst-uuid-1',
      });

      await tenantIdentification(mockReq, mockRes, mockNext);

      // Super admin without tenant headers runs in bypass mode
      expect(mockReq.tenantId).toBeUndefined();
      expect(runWithTenant).toHaveBeenCalledWith(null, true, expect.any(Function));
    });

    it('should run in bypass mode when no tenant can be identified', async () => {
      mockReq.headers.host = 'localhost:3000';

      await tenantIdentification(mockReq, mockRes, mockNext);

      expect(mockReq.tenantId).toBeUndefined();
      expect(runWithTenant).toHaveBeenCalledWith(null, true, expect.any(Function));
    });
  });

  // =========================================================================
  // 2. Inactive / Suspended Institutes & Expired Subscriptions
  // =========================================================================
  describe('2. Inactive Institutes & Subscription Expiry Controls', () => {
    it('should reject with 403 if institute isActive is false', async () => {
      mockReq.headers['x-tenant-id'] = 'inst-suspended';
      redis.get.mockResolvedValueOnce(null);
      prisma.institute.findUnique.mockResolvedValueOnce({
        ...validTenant,
        isActive: false,
      });

      await tenantIdentification(mockReq, mockRes, mockNext);

      const err = mockNext.mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe('This institute has been suspended. Please contact support.');
    });

    it('should reject with 403 if subscription status is explicitly suspended', async () => {
      mockReq.headers['x-tenant-id'] = 'inst-billing-suspended';
      redis.get.mockResolvedValueOnce(null);
      prisma.institute.findUnique.mockResolvedValueOnce({
        ...validTenant,
        subscription: { status: 'suspended' },
      });

      await tenantIdentification(mockReq, mockRes, mockNext);

      const err = mockNext.mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe(
        'This institute has been suspended due to billing. Please contact support.'
      );
    });

    it('should reject with 403 and trigger background status update if subscription expired past 7-day grace period', async () => {
      mockReq.headers['x-tenant-id'] = 'inst-expired-grace';
      redis.get.mockResolvedValueOnce(null);

      // Expired 10 days ago (past 7 day grace period)
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      prisma.institute.findUnique.mockResolvedValueOnce({
        ...validTenant,
        id: 'inst-expired-grace',
        subscription: { status: 'active', expiresAt: pastDate },
      });

      await tenantIdentification(mockReq, mockRes, mockNext);

      const err = mockNext.mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toMatch(/subscription has expired/i);
    });

    it('should ALLOW request if subscription is expired within the 7-day grace period', async () => {
      mockReq.headers['x-tenant-id'] = 'inst-in-grace';
      redis.get.mockResolvedValueOnce(null);

      // Expired 3 days ago (within 7 day grace period)
      const inGraceDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      prisma.institute.findUnique.mockResolvedValueOnce({
        ...validTenant,
        id: 'inst-in-grace',
        subscription: { status: 'active', expiresAt: inGraceDate },
      });

      await tenantIdentification(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.tenantId).toBe('inst-in-grace');
    });
  });

  // =========================================================================
  // 3. Guard Middlewares: requireTenant & optionalTenant
  // =========================================================================
  describe('3. requireTenant & optionalTenant Guards', () => {
    it('requireTenant should throw 400 Bad Request when req.tenantId is absent', () => {
      expect(() => requireTenant(mockReq, mockRes, mockNext)).toThrow(ApiError);
      try {
        requireTenant(mockReq, mockRes, mockNext);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.message).toMatch(/Tenant context required/i);
      }
    });

    it('requireTenant should pass when req.tenantId is present', () => {
      mockReq.tenantId = 'inst-uuid-1';
      requireTenant(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('optionalTenant should always pass through without throwing', () => {
      optionalTenant(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  // =========================================================================
  // 4. Resource Limits: Student, Teacher, and Storage Limits
  // =========================================================================
  describe('4. Resource Limits Enforcement (Student, Teacher, Storage)', () => {
    it('checkStudentLimit should reject with 403 when student count is >= limit', async () => {
      mockReq.tenantId = 'inst-uuid-1';
      mockReq.tenant = validTenant; // studentLimit = 50

      prisma.user.count.mockResolvedValueOnce(50); // at limit

      await checkStudentLimit(mockReq, mockRes, mockNext);

      const err = mockNext.mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toMatch(/student limit for this institute has been reached/i);
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { role: 'student', tenantId: 'inst-uuid-1' },
      });
    });

    it('checkStudentLimit should allow when student count is below limit', async () => {
      mockReq.tenantId = 'inst-uuid-1';
      mockReq.tenant = validTenant;

      prisma.user.count.mockResolvedValueOnce(49);

      await checkStudentLimit(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('checkTeacherLimit should reject with 403 when teacher count is >= limit', async () => {
      mockReq.tenantId = 'inst-uuid-1';
      mockReq.tenant = validTenant; // teacherLimit = 5

      prisma.user.count.mockResolvedValueOnce(5);

      await checkTeacherLimit(mockReq, mockRes, mockNext);

      const err = mockNext.mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toMatch(/teacher limit for this institute has been reached/i);
    });

    it('checkStorageLimit should reject with 403 when storage exceeds quota', async () => {
      mockReq.tenant = {
        ...validTenant,
        storageUsed: 4.8 * 1024 * 1024 * 1024, // 4.8 GB used
        limits: { storageLimit: 5 * 1024 * 1024 * 1024 }, // 5 GB limit
      };
      // Incoming file is 500 MB (0.5 GB) -> total 5.3 GB > 5 GB limit
      mockReq.headers['content-length'] = String(500 * 1024 * 1024);

      await checkStorageLimit(mockReq, mockRes, mockNext);

      const err = mockNext.mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toMatch(/Storage limit reached/i);
      expect(err.message).toContain('4.80 GB used of 5 GB');
    });

    it('checkStorageLimit should allow when storage is within quota', async () => {
      mockReq.tenant = {
        ...validTenant,
        storageUsed: 1 * 1024 * 1024 * 1024,
        limits: { storageLimit: 5 * 1024 * 1024 * 1024 },
      };
      mockReq.headers['content-length'] = String(100 * 1024 * 1024); // 100 MB

      await checkStorageLimit(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('checkStorageLimit should use 10GB default when limits.storageLimit is missing', async () => {
      mockReq.tenant = {
        ...validTenant,
        storageUsed: 9.8 * 1024 * 1024 * 1024, // 9.8 GB
        limits: {}, // no storageLimit defined
      };
      mockReq.headers['content-length'] = String(500 * 1024 * 1024); // 500 MB -> 10.3 GB > 10 GB default

      await checkStorageLimit(mockReq, mockRes, mockNext);

      const err = mockNext.mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toMatch(/Storage limit reached/i);
      expect(err.message).toContain('10 GB');
    });
  });

  // =========================================================================
  // 5. Invalidation Utilities
  // =========================================================================
  describe('5. Invalidation Utilities', () => {
    it('invalidateTenantCache should delete both subdomain and id keys in Redis', async () => {
      await invalidateTenantCache('apex', 'inst-uuid-1');

      expect(redis.del).toHaveBeenCalledWith('tenant:subdomain:apex');
      expect(redis.del).toHaveBeenCalledWith('tenant:id:inst-uuid-1');
    });
  });
});
