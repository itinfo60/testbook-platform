import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseRepository } from '../../src/core/base.repository.js';
import { TenantRepository } from '../../src/core/tenant.repository.js';
import { BaseService } from '../../src/core/base.service.js';
import { runWithTenant, getTenantId, isBypassTenant } from '../../src/core/tenant.context.js';
import { authenticate, optionalAuth } from '../../src/middleware/auth.js';
import {
  tenantIdentification,
  requireTenant,
  checkStudentLimit,
  checkTeacherLimit,
} from '../../src/middleware/tenant.middleware.js';
import { errorConverter, errorHandler } from '../../src/middleware/errorHandler.js';
import { auditLog } from '../../src/middleware/auditLog.js';
import database from '../../src/config/database.js';
import ApiError from '../../src/utils/ApiError.js';
import { prisma } from '../../src/config/prisma.js';
import redis from '../../src/config/redis.js';
import jwt from 'jsonwebtoken';
import config from '../../src/config/index.js';

// Mocks
vi.mock('../../src/config/redis.js', () => ({
  default: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
  },
}));

const { mockPrismaClient } = vi.hoisted(() => {
  const mockPrismaClient = {
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    user: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi
        .fn()
        .mockImplementation((args) => Promise.resolve({ id: 'uuid-1', ...(args.data || args) })),
      update: vi
        .fn()
        .mockImplementation((args) =>
          Promise.resolve({ id: args.where?.id || 'uuid-1', ...(args.data || {}) })
        ),
      delete: vi
        .fn()
        .mockImplementation((args) => Promise.resolve({ id: args.where?.id || 'uuid-1' })),
      count: vi.fn().mockResolvedValue(0),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    institute: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi
        .fn()
        .mockImplementation((args) => Promise.resolve({ id: 'uuid-1', ...(args.data || args) })),
      update: vi
        .fn()
        .mockImplementation((args) =>
          Promise.resolve({ id: args.where?.id || 'uuid-1', ...(args.data || {}) })
        ),
      delete: vi
        .fn()
        .mockImplementation((args) => Promise.resolve({ id: args.where?.id || 'uuid-1' })),
      count: vi.fn().mockResolvedValue(0),
    },
    course: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi
        .fn()
        .mockImplementation((args) => Promise.resolve({ id: 'uuid-1', ...(args.data || args) })),
      update: vi
        .fn()
        .mockImplementation((args) =>
          Promise.resolve({ id: args.where?.id || 'uuid-1', ...(args.data || {}) })
        ),
      delete: vi
        .fn()
        .mockImplementation((args) => Promise.resolve({ id: args.where?.id || 'uuid-1' })),
      count: vi.fn().mockResolvedValue(0),
    },
    blog: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    category: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    auditLog: {
      create: vi
        .fn()
        .mockImplementation((args) => Promise.resolve({ id: 'uuid-1', ...(args.data || args) })),
    },
  };
  return { mockPrismaClient };
});

vi.mock('../../src/config/prisma.js', () => ({
  prisma: mockPrismaClient,
  default: mockPrismaClient,
}));

describe('Milestone 1: Core Foundation & Infrastructure Tests', () => {
  describe('TenantContext', () => {
    it('should correctly bind and retrieve tenantId and bypass state', async () => {
      expect(getTenantId()).toBeNull();
      expect(isBypassTenant()).toBe(false);

      await runWithTenant('tenant-123', false, async () => {
        expect(getTenantId()).toBe('tenant-123');
        expect(isBypassTenant()).toBe(false);
      });

      await runWithTenant(null, true, async () => {
        expect(getTenantId()).toBeNull();
        expect(isBypassTenant()).toBe(true);
      });

      expect(getTenantId()).toBeNull();
    });
  });

  describe('BaseRepository & BaseService', () => {
    class TestRepo extends BaseRepository {
      constructor() {
        super(prisma.course);
      }
    }

    class TestService extends BaseService {
      constructor(repo) {
        super(repo);
      }
    }

    let repo;
    let service;

    beforeEach(() => {
      repo = new TestRepo();
      service = new TestService(repo);
      vi.clearAllMocks();
    });

    it('should delegate findMany, findUnique, findFirst, create, update, delete, count', async () => {
      prisma.course.findMany.mockResolvedValueOnce([{ id: 'c1', title: 'Course 1' }]);
      const res = await service.findMany({ where: { isPublished: true } });
      expect(res).toEqual([{ id: 'c1', title: 'Course 1' }]);
      expect(prisma.course.findMany).toHaveBeenCalledWith({ where: { isPublished: true } });

      prisma.course.findUnique.mockResolvedValueOnce({ id: 'c1', title: 'Course 1' });
      const unique = await service.findUnique({ where: { id: 'c1' } });
      expect(unique).toEqual({ id: 'c1', title: 'Course 1' });

      await service.create({ title: 'New Course' });
      expect(prisma.course.create).toHaveBeenCalledWith({ data: { title: 'New Course' } });

      await service.updateById('c1', { title: 'Updated' });
      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { title: 'Updated' },
      });

      await service.deleteById('c1');
      expect(prisma.course.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });

    it('should paginate correctly with skip, take, and pagination metadata', async () => {
      prisma.course.findMany.mockResolvedValueOnce([{ id: 'c1' }, { id: 'c2' }]);
      prisma.course.count.mockResolvedValueOnce(25);

      const result = await repo.paginate(
        { isPublished: true },
        { page: 2, limit: 10, sort: '-createdAt' }
      );
      expect(result.docs).toHaveLength(2);
      expect(result.total).toBe(25);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        pages: 3,
        hasNext: true,
        hasPrev: true,
      });
      expect(prisma.course.findMany).toHaveBeenCalledWith({
        where: { isPublished: true },
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('TenantRepository', () => {
    class TenantCourseRepo extends TenantRepository {
      constructor() {
        super(prisma.course);
      }
    }

    let repo;

    beforeEach(() => {
      repo = new TenantCourseRepo();
      vi.clearAllMocks();
    });

    it('should throw 401 when no tenant context is bound and not bypassing', async () => {
      await expect(repo.findMany()).rejects.toThrow(
        'Access denied: No active tenant context found.'
      );
    });

    it('should automatically inject tenantId into where clause when tenant context is active', async () => {
      prisma.course.findMany.mockResolvedValueOnce([]);

      await runWithTenant('inst-999', false, async () => {
        await repo.findMany({ where: { isPublished: true } });
        expect(prisma.course.findMany).toHaveBeenCalledWith({
          where: { isPublished: true, tenantId: 'inst-999' },
        });
      });
    });

    it('should bypass tenant filtering when bypass is enabled', async () => {
      prisma.course.findMany.mockResolvedValueOnce([]);

      await runWithTenant(null, true, async () => {
        await repo.findMany({ where: { isPublished: true } });
        expect(prisma.course.findMany).toHaveBeenCalledWith({
          where: { isPublished: true },
        });
      });
    });

    it('should inject tenantId on create automatically', async () => {
      await runWithTenant('inst-999', false, async () => {
        await repo.create({ title: 'Scoped Course' });
        expect(prisma.course.create).toHaveBeenCalledWith({
          data: { title: 'Scoped Course', tenantId: 'inst-999' },
        });
      });
    });
  });

  describe('Auth Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;

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
    });

    it('should authenticate user and set req.user, req.userId, and user._id shim', async () => {
      const token = jwt.sign({ id: 'user-1' }, config.jwt.secret);
      mockReq.headers.authorization = `Bearer ${token}`;

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@test.com',
        role: 'student',
        isActive: true,
        password: 'hashed_password',
      });

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.userId).toBe('user-1');
      expect(mockReq.user.id).toBe('user-1');
      expect(mockReq.user._id).toBe('user-1');
      expect(mockReq.user.password).toBeUndefined();
    });

    it('should optionalAuth populate user if valid token exists', async () => {
      const token = jwt.sign({ id: 'user-2' }, config.jwt.secret);
      mockReq.headers.authorization = `Bearer ${token}`;

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-2',
        email: 'user2@test.com',
        role: 'student',
        isActive: true,
        password: 'hashed',
      });

      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.userId).toBe('user-2');
      expect(mockReq.user.id).toBe('user-2');
      expect(mockReq.user._id).toBe('user-2');
    });
  });

  describe('Tenant Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
      mockReq = {
        headers: {},
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      mockNext = vi.fn();
      vi.clearAllMocks();
    });

    it('should resolve tenant by x-tenant-id header and populate req.tenant and req.tenantId', async () => {
      mockReq.headers['x-tenant-id'] = 'inst-1';

      prisma.institute.findUnique.mockResolvedValueOnce({
        id: 'inst-1',
        name: 'Test Institute',
        subdomain: 'testinst',
        isActive: true,
      });

      await tenantIdentification(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.tenantId).toBe('inst-1');
      expect(mockReq.tenant.id).toBe('inst-1');
      expect(mockReq.tenant._id).toBe('inst-1');
    });

    it('requireTenant should throw badRequest if no tenantId is set', () => {
      expect(() => requireTenant(mockReq, mockRes, mockNext)).toThrow('Tenant context required');
    });

    it('checkStudentLimit should call next with forbidden ApiError if student limit reached', async () => {
      mockReq.tenantId = 'inst-1';
      mockReq.tenant = {
        id: 'inst-1',
        limits: { studentLimit: 10 },
      };

      prisma.user.count.mockResolvedValueOnce(10);

      await checkStudentLimit(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const err = mockNext.mock.calls[0][0];
      expect(err.statusCode).toBe(403);
      expect(err.message).toContain('The student limit for this institute has been reached');
    });
  });

  describe('Prisma Error Handling in errorHandler', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
      mockReq = {
        method: 'POST',
        originalUrl: '/api/v1/users',
        ip: '127.0.0.1',
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      mockNext = vi.fn();
      vi.clearAllMocks();
    });

    it('should convert P2002 duplicate key error to 409 Conflict', () => {
      const error = new Error('Unique constraint failed');
      error.name = 'PrismaClientKnownRequestError';
      error.code = 'P2002';
      error.meta = { target: ['email'] };

      errorConverter(error, mockReq, mockRes, mockNext);

      const converted = mockNext.mock.calls[0][0];
      expect(converted).toBeInstanceOf(ApiError);
      expect(converted.statusCode).toBe(409);
      expect(converted.message).toContain("Duplicate value for 'email'");

      errorHandler(converted, mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    it('should convert P2025 not found error to 404 Not Found', () => {
      const error = new Error('Record not found');
      error.name = 'PrismaClientKnownRequestError';
      error.code = 'P2025';
      error.meta = { cause: 'User not found in database' };

      errorConverter(error, mockReq, mockRes, mockNext);

      const converted = mockNext.mock.calls[0][0];
      expect(converted).toBeInstanceOf(ApiError);
      expect(converted.statusCode).toBe(404);
      expect(converted.message).toBe('User not found in database');
    });

    it('should convert PrismaClientValidationError to 400 Bad Request', () => {
      const error = new Error('Invalid input');
      error.name = 'PrismaClientValidationError';

      errorConverter(error, mockReq, mockRes, mockNext);

      const converted = mockNext.mock.calls[0][0];
      expect(converted).toBeInstanceOf(ApiError);
      expect(converted.statusCode).toBe(400);
      expect(converted.message).toBe('Database validation error: Invalid input data');
    });

    it('should convert PrismaClientInitializationError to 503 Service Unavailable', () => {
      const error = new Error('Cannot connect to database');
      error.name = 'PrismaClientInitializationError';

      errorConverter(error, mockReq, mockRes, mockNext);

      const converted = mockNext.mock.calls[0][0];
      expect(converted).toBeInstanceOf(ApiError);
      expect(converted.statusCode).toBe(503);
      expect(converted.message).toBe('Database service temporarily unavailable');
    });
  });

  describe('Database Lifecycle Manager', () => {
    it('connect, disconnect, and getStatus should interact with Prisma Client', async () => {
      const conn = await database.connect();
      expect(conn).toBeDefined();
      expect(prisma.$connect).toHaveBeenCalled();
      expect(prisma.$queryRaw).toHaveBeenCalled();

      const status = await database.getStatus();
      expect(status).toEqual({ status: 'connected', provider: 'postgresql' });

      await database.disconnect();
      expect(prisma.$disconnect).toHaveBeenCalled();
    });
  });
});
