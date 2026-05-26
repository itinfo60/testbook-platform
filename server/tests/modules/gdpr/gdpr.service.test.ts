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

import { GdprService } from '../../../src/modules/gdpr/gdpr.service.js';
import User from '../../../src/modules/user/user.model.js';
import Enrollment from '../../../src/modules/enrollment/enrollment.model.js';
import Payment from '../../../src/modules/payment/payment.model.js';
import redis from '../../../src/config/redis.js';
import { runWithTenant } from '../../../src/core/tenant.context.js';

describe('GdprService', () => {
  let gdprService: GdprService;
  const mockTenantId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    gdprService = new GdprService();
    await User.deleteMany({});
    await Enrollment.deleteMany({});
    await Payment.deleteMany({});
    await redis.flush();
    vi.clearAllMocks();
  });

  describe('exportMyData', () => {
    it('should export all user data successfully', async () => {
      const user = await runWithTenant(mockTenantId, false, () =>
        User.create({
          name: 'Jane Consent',
          email: 'jane-consent@test.com',
          password: 'Password123!',
          role: 'student',
          phone: '9876543210',
          bio: 'My sweet bio',
          tenantId: mockTenantId,
        })
      );

      const courseId = new mongoose.Types.ObjectId();
      await runWithTenant(mockTenantId, false, () =>
        Enrollment.create({
          user: user._id,
          course: courseId,
          status: 'active',
          progressPercentage: 10,
        })
      );

      await runWithTenant(mockTenantId, false, () =>
        Payment.create({
          user: user._id,
          course: courseId,
          amount: 999,
          currency: 'INR',
          orderId: 'order_123',
          status: 'completed',
          tenantId: mockTenantId,
        })
      );

      const payload = await gdprService.exportMyData(user._id.toString());

      expect(payload.personal.name).toBe('Jane Consent');
      expect(payload.personal.email).toBe('jane-consent@test.com');
      expect(payload.personal.phone).toBe('9876543210');
      expect(payload.personal.bio).toBe('My sweet bio');
      expect(payload.enrollments).toHaveLength(1);
      expect(payload.enrollments[0].courseId).toBe(courseId.toString());
      expect(payload.payments).toHaveLength(1);
      expect(payload.payments[0].amount).toBe(999);
    });

    it('should throw an error if the user is not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(gdprService.exportMyData(nonExistentId)).rejects.toThrow('User not found');
    });
  });

  describe('eraseMyData', () => {
    it('should throw error for local provider when password is not verified or incorrect', async () => {
      const user = await runWithTenant(mockTenantId, false, () =>
        User.create({
          name: 'Jane Erase',
          email: 'jane-erase@test.com',
          password: 'Password123!',
          role: 'student',
          authProvider: 'local',
          tenantId: mockTenantId,
        })
      );

      await expect(gdprService.eraseMyData(user._id.toString(), 'WrongPassword')).rejects.toThrow(
        'Invalid password'
      );

      await expect(gdprService.eraseMyData(user._id.toString(), undefined)).rejects.toThrow(
        'Password is required to confirm data erasure'
      );
    });

    it('should erase user personal data and deactivate the account successfully', async () => {
      const user = await runWithTenant(mockTenantId, false, () =>
        User.create({
          name: 'Jane Erase',
          email: 'jane-erase@test.com',
          password: 'Password123!',
          role: 'student',
          authProvider: 'local',
          phone: '9876543210',
          bio: 'Old bio',
          tenantId: mockTenantId,
        })
      );

      await redis.set(`user_${user._id}`, { name: 'Jane Erase' }, 100);

      await gdprService.eraseMyData(user._id.toString(), 'Password123!');

      const updated = await runWithTenant(null, true, () => User.findById(user._id));
      expect(updated!.name).toBe('[Deleted User]');
      expect(updated!.email).toBe(`deleted_${user._id.toString()}@erased.invalid`);
      expect(updated!.phone).toBeUndefined();
      expect(updated!.bio).toBe('');
      expect(updated!.isActive).toBe(false);

      const cached = await redis.get(`user_${user._id}`);
      expect(cached).toBeUndefined();
    });
  });

  describe('recordConsent', () => {
    it('should record consent details and invalidate cache', async () => {
      const user = await runWithTenant(mockTenantId, false, () =>
        User.create({
          name: 'Jane Consent',
          email: 'jane-consent@test.com',
          password: 'Password123!',
          role: 'student',
          tenantId: mockTenantId,
        })
      );

      await redis.set(`user_${user._id}`, { name: 'Jane Consent' }, 100);

      await gdprService.recordConsent(user._id.toString(), '2.0');

      const updated = await runWithTenant(mockTenantId, false, () => User.findById(user._id));
      expect(updated!.consentGiven).toBe(true);
      expect(updated!.consentAt).toBeDefined();
      expect(updated!.dataRetentionPolicyVersion).toBe('2.0');

      const cached = await redis.get(`user_${user._id}`);
      expect(cached).toBeUndefined();
    });
  });

  describe('getConsentStatus', () => {
    it('should return consent properties of the user', async () => {
      const user = await runWithTenant(mockTenantId, false, () =>
        User.create({
          name: 'Jane Consent',
          email: 'jane-consent@test.com',
          password: 'Password123!',
          role: 'student',
          consentGiven: true,
          consentAt: new Date('2026-01-01'),
          dataRetentionPolicyVersion: '1.5',
          tenantId: mockTenantId,
        })
      );

      const result = await gdprService.getConsentStatus(user._id.toString());
      expect(result.consentGiven).toBe(true);
      expect(result.dataRetentionPolicyVersion).toBe('1.5');
    });
  });
});
