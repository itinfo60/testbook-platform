import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  tenantIdentification,
  requireTenant,
  checkStudentLimit,
  checkTeacherLimit,
} from '../../src/middleware/tenant.middleware.js';
import ApiError from '../../src/utils/ApiError.js';

// Mock Institute model
vi.mock('../../src/modules/institute/institute.model.js', () => ({
  default: {
    findById: vi.fn(),
    findOne: vi.fn(),
  },
}));

// Mock User model
vi.mock('../../src/modules/user/user.model.js', () => ({
  default: {
    countDocuments: vi.fn(),
  },
}));

// Mock TenantContext
vi.mock('../../src/utils/TenantContext.js', () => ({
  runWithTenant: vi.fn((tenantId, bypass, cb) => cb()),
}));

import Institute from '../../src/modules/institute/institute.model.js';
import User from '../../src/modules/user/user.model.js';
import { runWithTenant } from '../../src/utils/TenantContext.js';

describe('Tenant Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  const activeTenant = {
    _id: 'tenant123',
    subdomain: 'alpha',
    isActive: true,
    subscription: {
      status: 'active',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    limits: { studentLimit: 100, teacherLimit: 5 },
    save: vi.fn(),
  };

  beforeEach(() => {
    mockReq = { headers: {}, cookies: {} };
    mockRes = {};
    mockNext = vi.fn();
    vi.clearAllMocks();
    runWithTenant.mockImplementation((tenantId, bypass, cb) => cb());
  });

  // ─────────────────────────────────────────────────────────
  describe('tenantIdentification', () => {
    it('should identify tenant by X-Tenant-Subdomain header', async () => {
      mockReq.headers['x-tenant-subdomain'] = 'alpha';
      Institute.findOne.mockResolvedValue(activeTenant);

      await tenantIdentification(mockReq, mockRes, mockNext);

      expect(Institute.findOne).toHaveBeenCalledWith({ subdomain: 'alpha' });
      expect(mockReq.tenantId).toBe('tenant123');
      expect(mockReq.tenant).toBe(activeTenant);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should identify tenant by X-Tenant-Id header', async () => {
      mockReq.headers['x-tenant-id'] = 'tenant123';
      Institute.findById.mockResolvedValue(activeTenant);

      await tenantIdentification(mockReq, mockRes, mockNext);

      expect(Institute.findById).toHaveBeenCalledWith('tenant123');
      expect(mockReq.tenantId).toBe('tenant123');
    });

    it('should parse subdomain from host header (e.g. alpha.localhost)', async () => {
      mockReq.headers.host = 'alpha.localhost:5000';
      Institute.findOne.mockResolvedValue(activeTenant);

      await tenantIdentification(mockReq, mockRes, mockNext);

      expect(Institute.findOne).toHaveBeenCalledWith({ subdomain: 'alpha' });
      expect(mockReq.tenantId).toBe('tenant123');
    });

    it('should parse subdomain from production host (e.g. alpha.platform.com)', async () => {
      mockReq.headers.host = 'alpha.platform.com';
      Institute.findOne.mockResolvedValue(activeTenant);

      await tenantIdentification(mockReq, mockRes, mockNext);

      expect(Institute.findOne).toHaveBeenCalledWith({ subdomain: 'alpha' });
    });

    it('should skip tenant identification on plain localhost host', async () => {
      mockReq.headers.host = 'localhost:5000';

      await tenantIdentification(mockReq, mockRes, mockNext);

      expect(Institute.findOne).not.toHaveBeenCalled();
      expect(Institute.findById).not.toHaveBeenCalled();
      expect(mockReq.tenantId).toBeUndefined();
      expect(runWithTenant).toHaveBeenCalledWith(null, true, expect.any(Function));
    });

    it('should throw 403 if institute is inactive', async () => {
      mockReq.headers['x-tenant-subdomain'] = 'alpha';
      Institute.findOne.mockResolvedValue({ ...activeTenant, isActive: false });

      await tenantIdentification(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(403);
      expect(error.message).toMatch(/suspended/);
    });

    it('should throw 403 if subscription status is suspended', async () => {
      mockReq.headers['x-tenant-subdomain'] = 'alpha';
      Institute.findOne.mockResolvedValue({
        ...activeTenant,
        subscription: { ...activeTenant.subscription, status: 'suspended' },
      });

      await tenantIdentification(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
      expect(error.message).toMatch(/billing/);
    });

    it('should throw 403 if subscription has expired', async () => {
      mockReq.headers['x-tenant-subdomain'] = 'alpha';
      const expiredTenant = {
        ...activeTenant,
        subscription: {
          status: 'active',
          expiresAt: new Date(Date.now() - 1000), // expired yesterday
        },
        save: vi.fn(),
      };
      Institute.findOne.mockResolvedValue(expiredTenant);

      await tenantIdentification(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
      expect(error.message).toMatch(/expired/);
    });

    it('should run in bypass mode if no tenant is found', async () => {
      mockReq.headers.host = 'localhost:5000';

      await tenantIdentification(mockReq, mockRes, mockNext);

      expect(runWithTenant).toHaveBeenCalledWith(null, true, expect.any(Function));
    });
  });

  // ─────────────────────────────────────────────────────────
  describe('requireTenant', () => {
    it('should throw 400 if no tenantId on req', () => {
      delete mockReq.tenantId;

      expect(() => requireTenant(mockReq, mockRes, mockNext)).toThrow(ApiError);

      try {
        requireTenant(mockReq, mockRes, mockNext);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.message).toMatch(/Tenant context required/);
      }
    });

    it('should call next if tenantId is set', () => {
      mockReq.tenantId = 'tenant123';

      requireTenant(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  // ─────────────────────────────────────────────────────────
  describe('checkStudentLimit', () => {
    it('should call next if no tenant on req', async () => {
      delete mockReq.tenant;
      await checkStudentLimit(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw 403 if student limit is reached', async () => {
      mockReq.tenant = activeTenant;
      mockReq.tenantId = 'tenant123';
      User.countDocuments.mockResolvedValue(100); // at the limit

      await checkStudentLimit(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(403);
      expect(error.message).toMatch(/student limit/i);
    });

    it('should call next if student count is below limit', async () => {
      mockReq.tenant = activeTenant;
      mockReq.tenantId = 'tenant123';
      User.countDocuments.mockResolvedValue(50); // below limit

      await checkStudentLimit(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  // ─────────────────────────────────────────────────────────
  describe('checkTeacherLimit', () => {
    it('should throw 403 if teacher limit is reached', async () => {
      mockReq.tenant = activeTenant;
      mockReq.tenantId = 'tenant123';
      User.countDocuments.mockResolvedValue(5); // at the limit

      await checkTeacherLimit(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(403);
      expect(error.message).toMatch(/teacher limit/i);
    });

    it('should call next if teacher count is below limit', async () => {
      mockReq.tenant = activeTenant;
      mockReq.tenantId = 'tenant123';
      User.countDocuments.mockResolvedValue(2);

      await checkTeacherLimit(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
