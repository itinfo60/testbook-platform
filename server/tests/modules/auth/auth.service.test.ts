import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';

const mockRedisStore = new Map<string, any>();

vi.mock('../../../src/config/redis.js', () => ({
  default: {
    isConnected: true,
    get: vi.fn(async (key: string) => mockRedisStore.get(key)),
    set: vi.fn(async (key: string, value: any) => {
      mockRedisStore.set(key, value);
      return true;
    }),
    del: vi.fn(async (key: string) => {
      mockRedisStore.delete(key);
      return true;
    }),
    flush: vi.fn(async () => {
      mockRedisStore.clear();
      return true;
    }),
  },
}));

import { AuthService } from '../../../src/modules/auth/auth.service.js';
import User from '../../../src/modules/user/user.model.js';
import redis from '../../../src/config/redis.js';
import { runWithTenant } from '../../../src/core/tenant.context.js';
import jwt from 'jsonwebtoken';
import config from '../../../src/config/index.js';

describe('AuthService', () => {
  let authService: AuthService;
  const mockTenantId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    authService = new AuthService();
    await User.deleteMany({});
    await redis.flush();
    vi.clearAllMocks();
  });

  describe('Register', () => {
    it('should register a student successfully', async () => {
      const result = await authService.register(
        {
          name: 'Jane Doe',
          email: 'jane@test.com',
          password: 'Password123!',
          role: 'student',
        },
        mockTenantId,
        { studentLimit: 5, teacherLimit: 2 },
        'test-device'
      );

      expect(result.user.name).toBe('Jane Doe');
      expect(result.user.email).toBe('jane@test.com');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();

      const user = await runWithTenant(mockTenantId, false, () =>
        User.findOne({ email: 'jane@test.com' })
      );
      expect(user).toBeDefined();
      expect(user!.tenantId.toString()).toBe(mockTenantId);
    });

    it('should block registration if student limits are exceeded', async () => {
      await expect(
        authService.register(
          {
            name: 'Jane Doe',
            email: 'jane@test.com',
            password: 'Password123!',
            role: 'student',
          },
          mockTenantId,
          { studentLimit: 0, teacherLimit: 2 },
          'test-device'
        )
      ).rejects.toThrow('The student limit for this institute has been reached');
    });

    it('should prevent registering duplicate email globally', async () => {
      await authService.register(
        {
          name: 'Jane Doe',
          email: 'jane@test.com',
          password: 'Password123!',
          role: 'student',
        },
        mockTenantId,
        { studentLimit: 5, teacherLimit: 2 },
        'test-device'
      );

      const anotherTenant = new mongoose.Types.ObjectId().toString();
      await expect(
        authService.register(
          {
            name: 'Jane Doe',
            email: 'jane@test.com',
            password: 'Password123!',
            role: 'student',
          },
          anotherTenant,
          { studentLimit: 5, teacherLimit: 2 },
          'test-device'
        )
      ).rejects.toThrow('Email is already registered');
    });
  });

  describe('Login & Lockout', () => {
    it('should login student successfully', async () => {
      await authService.register(
        {
          name: 'Jane Doe',
          email: 'jane@test.com',
          password: 'Password123!',
          role: 'student',
        },
        mockTenantId,
        { studentLimit: 5, teacherLimit: 2 },
        'test-device'
      );

      const result = await authService.login(
        { email: 'jane@test.com', password: 'Password123!' },
        mockTenantId,
        'test-device'
      );

      expect('tokens' in result).toBe(true);
      const resDto = result as any;
      expect(resDto.tokens.accessToken).toBeDefined();
      expect(resDto.user.email).toBe('jane@test.com');
    });

    it('should implement lockout after 5 failed login attempts', async () => {
      await authService.register(
        {
          name: 'Jane Doe',
          email: 'jane@test.com',
          password: 'Password123!',
          role: 'student',
        },
        mockTenantId,
        { studentLimit: 5, teacherLimit: 2 },
        'test-device'
      );

      for (let i = 0; i < 5; i++) {
        await expect(
          authService.login(
            { email: 'jane@test.com', password: 'WrongPassword' },
            mockTenantId,
            'device'
          )
        ).rejects.toThrow('Invalid email or password');
      }

      await expect(
        authService.login(
          { email: 'jane@test.com', password: 'WrongPassword' },
          mockTenantId,
          'device'
        )
      ).rejects.toThrow('Account temporarily locked');
    });
  });

  describe('Refresh Token Rotation & Family Invalidation', () => {
    it('should rotate refresh token and issue new token pair', async () => {
      const reg = await authService.register(
        {
          name: 'Jane Doe',
          email: 'jane@test.com',
          password: 'Password123!',
          role: 'student',
        },
        mockTenantId,
        { studentLimit: 5, teacherLimit: 2 },
        'test-device'
      );

      const rotateResult = await authService.refreshToken(reg.tokens.refreshToken, 'new-device');
      expect(rotateResult.accessToken).toBeDefined();
      expect(rotateResult.newRefreshToken).toBeDefined();
      expect(rotateResult.newRefreshToken).not.toBe(reg.tokens.refreshToken);
    });

    it('should invalidate token family when a reused refresh token is presented', async () => {
      const reg = await authService.register(
        {
          name: 'Jane Doe',
          email: 'jane@test.com',
          password: 'Password123!',
          role: 'student',
        },
        mockTenantId,
        { studentLimit: 5, teacherLimit: 2 },
        'test-device'
      );

      const oldToken = reg.tokens.refreshToken;

      // Rotate token first time (legitimate flow)
      const rotate1 = await authService.refreshToken(oldToken, 'device-1');
      expect(rotate1.accessToken).toBeDefined();

      // Attacker presents the oldToken again
      await expect(authService.refreshToken(oldToken, 'device-attacker')).rejects.toThrow(
        'Invalid or expired refresh token'
      );

      // Legitimate user's session should now be invalidated
      const user = await runWithTenant(mockTenantId, false, () =>
        User.findOne({ email: 'jane@test.com' }).select('+refreshTokens')
      );
      expect(user!.refreshTokens.length).toBe(0);
    });
  });
});
