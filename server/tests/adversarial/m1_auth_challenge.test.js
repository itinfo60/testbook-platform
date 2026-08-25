import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticate, authorize, optionalAuth } from '../../src/middleware/auth.js';
import ApiError from '../../src/utils/ApiError.js';
import redis from '../../src/config/redis.js';
import config from '../../src/config/index.js';
import { prisma } from '../../src/config/prisma.js';

vi.mock('../../src/config/redis.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock('../../src/config/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Milestone 1 Adversarial Challenge: Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  const JWT_SECRET = config.jwt.secret;

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

  // =========================================================================
  // 1. Missing Token & Malformed Header Formats
  // =========================================================================
  describe('1. Missing Token & Malformed Header Edge Cases', () => {
    it('should reject when headers and cookies are completely empty', async () => {
      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const err = mockNext.mock.calls[0][0];
      expect(err.statusCode).toBe(401);
      expect(err.message).toMatch(/Access token required/i);
    });

    it('should reject when Authorization header contains only "Bearer"', async () => {
      mockReq.headers.authorization = 'Bearer ';
      await authenticate(mockReq, mockRes, mockNext);

      const err = mockNext.mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toMatch(/Access token required/i);
    });

    it('should reject when Authorization header uses unsupported scheme (e.g. Basic)', async () => {
      mockReq.headers.authorization = 'Basic dXNlcjpwYXNz';
      await authenticate(mockReq, mockRes, mockNext);

      const err = mockNext.mock.calls[0][0];
      expect(err.statusCode).toBe(401);
      expect(err.message).toMatch(/Access token required/i);
    });

    it('should fall back to cookies.accessToken if Authorization header is missing', async () => {
      const token = jwt.sign({ id: 'user-from-cookie' }, JWT_SECRET);
      mockReq.cookies.accessToken = token;

      redis.get.mockResolvedValueOnce(null); // not blacklisted
      redis.get.mockResolvedValueOnce(null); // not in user cache

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-from-cookie',
        email: 'cookie@test.com',
        role: 'student',
        isActive: true,
        password: 'hashed_password',
      });

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.userId).toBe('user-from-cookie');
      expect(mockReq.user.id).toBe('user-from-cookie');
    });
  });

  // =========================================================================
  // 2. Invalid Signature, Tampered Payload, and Expired Tokens
  // =========================================================================
  describe('2. Token Integrity, Tampering & Expiration', () => {
    it('should reject token signed with an invalid/wrong secret key', async () => {
      const forgedToken = jwt.sign({ id: 'user-1' }, 'wrong-secret-key');
      mockReq.headers.authorization = `Bearer ${forgedToken}`;
      redis.get.mockResolvedValueOnce(null); // not blacklisted

      await authenticate(mockReq, mockRes, mockNext);

      const err = mockNext.mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Invalid token. Please login again.');
    });

    it('should reject structurally corrupted token string', async () => {
      mockReq.headers.authorization = 'Bearer invalid.corrupted.token.payload';
      redis.get.mockResolvedValueOnce(null);

      await authenticate(mockReq, mockRes, mockNext);

      const err = mockNext.mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Invalid token. Please login again.');
    });

    it('should reject expired token with explicit Session expired message', async () => {
      const expiredToken = jwt.sign(
        { id: 'user-1', exp: Math.floor(Date.now() / 1000) - 60 },
        JWT_SECRET
      );
      mockReq.headers.authorization = `Bearer ${expiredToken}`;
      redis.get.mockResolvedValueOnce(null);

      await authenticate(mockReq, mockRes, mockNext);

      const err = mockNext.mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Session expired. Please login again.');
    });
  });

  // =========================================================================
  // 3. Redis Blacklist / Token Revocation & Cache Resilience
  // =========================================================================
  describe('3. Token Revocation (Redis Blacklist) & Redis Failure Resilience', () => {
    it('should reject token if blacklisted in Redis', async () => {
      const token = jwt.sign({ id: 'user-1' }, JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;

      redis.get.mockResolvedValueOnce('revoked'); // blacklisted

      await authenticate(mockReq, mockRes, mockNext);

      const err = mockNext.mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Token has been revoked. Please login again.');
      // Should not query user if token is blacklisted
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should survive Redis downtime gracefully and fall back to database query', async () => {
      const token = jwt.sign({ id: 'user-1' }, JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;

      // Simulate Redis connection failure
      redis.get.mockRejectedValue(new Error('Redis connection refused: ECONNREFUSED'));
      redis.set.mockRejectedValue(new Error('Redis connection refused: ECONNREFUSED'));

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'fallback@test.com',
        role: 'teacher',
        isActive: true,
        password: 'hashed_password',
      });

      await authenticate(mockReq, mockRes, mockNext);

      // Successfully authenticated via DB despite Redis error
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.userId).toBe('user-1');
      expect(mockReq.user.email).toBe('fallback@test.com');
      expect(mockReq.user.password).toBeUndefined();
    });

    it('should sanitize password from user object and inject _id compatibility shim', async () => {
      const token = jwt.sign({ id: 'user-pwd-check' }, JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;

      redis.get.mockResolvedValueOnce(null); // not blacklisted
      redis.get.mockResolvedValueOnce(null); // not cached

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-pwd-check',
        email: 'secure@test.com',
        role: 'student',
        isActive: true,
        password: 'super_secret_bcrypt_hash',
      });

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockReq.user.password).toBeUndefined();
      expect(mockReq.user.id).toBe('user-pwd-check');
      expect(mockReq.user._id).toBe('user-pwd-check');
      expect(redis.set).toHaveBeenCalledWith(
        'user_user-pwd-check',
        expect.not.objectContaining({ password: expect.anything() }),
        300
      );
    });
  });

  // =========================================================================
  // 4. User Status: Deactivated & Deleted
  // =========================================================================
  describe('4. Deactivated and Deleted User Edge Cases', () => {
    it('should reject deactivated user with 403 Forbidden', async () => {
      const token = jwt.sign({ id: 'user-inactive' }, JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;

      redis.get.mockResolvedValueOnce(null);
      redis.get.mockResolvedValueOnce({
        id: 'user-inactive',
        isActive: false,
        role: 'student',
      });

      await authenticate(mockReq, mockRes, mockNext);

      const err = mockNext.mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe('Account has been deactivated. Contact support.');
    });

    it('should reject deleted/non-existent user with 401 Unauthorized', async () => {
      const token = jwt.sign({ id: 'deleted-user' }, JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;

      redis.get.mockResolvedValueOnce(null); // not blacklisted
      redis.get.mockResolvedValueOnce(null); // not in cache
      prisma.user.findUnique.mockResolvedValueOnce(null); // not in DB

      await authenticate(mockReq, mockRes, mockNext);

      const err = mockNext.mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('User not found. Account may have been deleted.');
    });
  });

  // =========================================================================
  // 5. Cross-Tenant Token Access
  // =========================================================================
  describe('5. Cross-Tenant Token Security', () => {
    it('should reject student/teacher token belonging to Institute A when accessing Institute B', async () => {
      const token = jwt.sign({ id: 'student-inst-A' }, JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;
      mockReq.tenantId = 'institute-B';

      redis.get.mockResolvedValueOnce(null);
      redis.get.mockResolvedValueOnce({
        id: 'student-inst-A',
        role: 'student',
        tenantId: 'institute-A',
        isActive: true,
      });

      await authenticate(mockReq, mockRes, mockNext);

      const err = mockNext.mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe('Access denied. You do not belong to this institute.');
    });

    it('should allow super_admin token with Institute A to access Institute B without cross-tenant rejection', async () => {
      const token = jwt.sign({ id: 'super-admin-1' }, JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;
      mockReq.tenantId = 'institute-B';

      redis.get.mockResolvedValueOnce(null);
      redis.get.mockResolvedValueOnce({
        id: 'super-admin-1',
        role: 'super_admin',
        tenantId: 'institute-A',
        isActive: true,
      });

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.userId).toBe('super-admin-1');
    });

    it('should allow user with tenantId: null (global user) to access any tenant', async () => {
      const token = jwt.sign({ id: 'global-user' }, JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;
      mockReq.tenantId = 'institute-B';

      redis.get.mockResolvedValueOnce(null);
      redis.get.mockResolvedValueOnce({
        id: 'global-user',
        role: 'student',
        tenantId: null,
        isActive: true,
      });

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow user with tenantId matching req.tenantId', async () => {
      const token = jwt.sign({ id: 'student-inst-A' }, JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;
      mockReq.tenantId = 'institute-A';

      redis.get.mockResolvedValueOnce(null);
      redis.get.mockResolvedValueOnce({
        id: 'student-inst-A',
        role: 'student',
        tenantId: 'institute-A',
        isActive: true,
      });

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.tenantId).toBe('institute-A');
    });
  });

  // =========================================================================
  // 6. Role Authorization & optionalAuth Edge Cases
  // =========================================================================
  describe('6. Role Authorization & optionalAuth Edge Cases', () => {
    it('authorize should throw 401 if req.user is absent', () => {
      const authRole = authorize('admin');
      expect(() => authRole(mockReq, mockRes, mockNext)).toThrow(ApiError);
      try {
        authRole(mockReq, mockRes, mockNext);
      } catch (err) {
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe('Authentication required');
      }
    });

    it('authorize should throw 403 with exact unauthorized role name', () => {
      const authRole = authorize('admin', 'teacher');
      mockReq.user = { id: 'u1', role: 'student' };

      expect(() => authRole(mockReq, mockRes, mockNext)).toThrow(ApiError);
      try {
        authRole(mockReq, mockRes, mockNext);
      } catch (err) {
        expect(err.statusCode).toBe(403);
        expect(err.message).toBe("Role 'student' is not authorized to access this resource");
      }
    });

    it('optionalAuth should silently proceed without setting req.user on invalid token', async () => {
      mockReq.headers.authorization = 'Bearer corrupt.token';
      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.user).toBeUndefined();
    });

    it('optionalAuth should not attach deactivated user', async () => {
      const token = jwt.sign({ id: 'inactive-user' }, JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'inactive-user',
        isActive: false,
        role: 'student',
      });

      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.user).toBeUndefined();
    });
  });
});
