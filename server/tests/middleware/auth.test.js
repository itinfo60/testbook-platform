import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticate, authorize, optionalAuth } from '../../src/middleware/auth.js';
import ApiError from '../../src/utils/ApiError.js';
import redis from '../../src/config/redis.js';
import config from '../../src/config/index.js';
import { prisma } from '../../src/config/prisma.js';

vi.mock('jsonwebtoken');
vi.mock('../../src/config/redis.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));
vi.mock('../../src/config/index.js', () => ({
  default: {
    jwt: { secret: 'test-secret' },
  },
}));
vi.mock('../../src/config/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      cookies: {},
    };
    mockRes = {};
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should throw Unauthorized if no token provided', async () => {
      await authenticate(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toMatch(/Access token required/);
    });

    it('should extract token from Bearer header', async () => {
      mockReq.headers.authorization = 'Bearer validtoken';
      redis.get.mockResolvedValueOnce(null); // not blacklisted
      jwt.verify.mockReturnValueOnce({ id: 'user1' });
      redis.get.mockResolvedValueOnce({ id: 'user1', _id: 'user1', isActive: true }); // user found in cache

      await authenticate(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'test-secret');
      expect(mockReq.user).toBeDefined();
      expect(mockNext).toHaveBeenCalledWith(); // success, no error
    });

    it('should extract token from cookies', async () => {
      mockReq.cookies.accessToken = 'cookietoken';
      redis.get.mockResolvedValueOnce(null);
      jwt.verify.mockReturnValueOnce({ id: 'user1' });
      redis.get.mockResolvedValueOnce({ id: 'user1', _id: 'user1', isActive: true });

      await authenticate(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('cookietoken', 'test-secret');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw Unauthorized if token is blacklisted', async () => {
      mockReq.headers.authorization = 'Bearer blacklistedtoken';
      redis.get.mockResolvedValueOnce(true); // blacklisted

      await authenticate(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toMatch(/revoked/);
    });

    it('should query DB if user not in cache and cache the result', async () => {
      mockReq.headers.authorization = 'Bearer token';
      redis.get.mockResolvedValueOnce(null); // not blacklisted
      jwt.verify.mockReturnValueOnce({ id: 'user1' });
      redis.get.mockResolvedValueOnce(null); // not in cache

      const dbUser = { id: 'user1', password: 'secret', isActive: true };
      const expectedCached = { id: 'user1', _id: 'user1', isActive: true };
      prisma.user.findUnique.mockResolvedValueOnce(dbUser);

      await authenticate(mockReq, mockRes, mockNext);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user1' } });
      expect(redis.set).toHaveBeenCalledWith('user_user1', expectedCached, 300);
      expect(mockReq.user).toEqual(expectedCached);
    });

    it('should throw Unauthorized if user not found in DB', async () => {
      mockReq.headers.authorization = 'Bearer token';
      redis.get.mockResolvedValueOnce(null);
      jwt.verify.mockReturnValueOnce({ id: 'user1' });
      redis.get.mockResolvedValueOnce(null);

      prisma.user.findUnique.mockResolvedValueOnce(null);

      await authenticate(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toMatch(/User not found/);
    });

    it('should throw Forbidden if user is inactive', async () => {
      mockReq.headers.authorization = 'Bearer token';
      redis.get.mockResolvedValueOnce(null);
      jwt.verify.mockReturnValueOnce({ id: 'user1' });
      redis.get.mockResolvedValueOnce({ id: 'user1', _id: 'user1', isActive: false });

      await authenticate(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
      expect(error.message).toMatch(/deactivated/);
    });
  });

  describe('authorize', () => {
    it('should throw Unauthorized if req.user is undefined', () => {
      const middleware = authorize('admin');

      expect(() => middleware(mockReq, mockRes, mockNext)).toThrow(ApiError);

      try {
        middleware(mockReq, mockRes, mockNext);
      } catch (err) {
        expect(err.statusCode).toBe(401);
      }
    });

    it('should throw Forbidden if user role is not allowed', () => {
      const middleware = authorize('teacher');
      mockReq.user = { role: 'student' };

      expect(() => middleware(mockReq, mockRes, mockNext)).toThrow(ApiError);

      try {
        middleware(mockReq, mockRes, mockNext);
      } catch (err) {
        expect(err.statusCode).toBe(403);
      }
    });

    it('should call next if user role is allowed', () => {
      const middleware = authorize('admin', 'teacher');
      mockReq.user = { role: 'admin' };

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should allow super_admin to access any authorized resource', () => {
      const middleware = authorize('teacher');
      mockReq.user = { role: 'super_admin' };

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should allow admin to access teacher resources', () => {
      const middleware = authorize('teacher');
      mockReq.user = { role: 'admin' };

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('optionalAuth', () => {
    it('should proceed without setting req.user if no token', async () => {
      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should silently fail and proceed if token is invalid', async () => {
      mockReq.headers.authorization = 'Bearer invalid';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid');
      });

      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should set req.user if token is valid and user is active', async () => {
      mockReq.headers.authorization = 'Bearer valid';
      jwt.verify.mockReturnValue({ id: 'user1' });

      const dbUser = { id: 'user1', password: 'secret', isActive: true };
      const expectedUser = { id: 'user1', _id: 'user1', isActive: true };
      prisma.user.findUnique.mockResolvedValueOnce(dbUser);

      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual(expectedUser);
      expect(mockReq.userId).toBe('user1');
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
