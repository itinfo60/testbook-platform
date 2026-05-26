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

import { CouponService } from '../../../src/modules/coupon/coupon.service.js';
import Coupon from '../../../src/modules/coupon/coupon.model.js';
import User from '../../../src/modules/user/user.model.js';
import redis from '../../../src/config/redis.js';
import { runWithTenant } from '../../../src/core/tenant.context.js';

describe('CouponService', () => {
  let couponService: CouponService;
  const tenantA = new mongoose.Types.ObjectId().toString();
  const tenantB = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    couponService = new CouponService();
    try {
      await Coupon.collection.dropIndex('code_1');
    } catch (e) {
      // ignore if it doesn't exist
    }
    await Coupon.deleteMany({});
    await User.deleteMany({});
    await redis.flush();
    vi.clearAllMocks();
  });

  describe('createCoupon', () => {
    it('should create a coupon successfully and upper-case the code', async () => {
      const coupon = await runWithTenant(tenantA, false, () =>
        couponService.createCoupon({
          code: 'winter50',
          discountType: 'percentage',
          discountValue: 50,
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000),
        })
      );

      expect(coupon.code).toBe('WINTER50');
      expect(coupon.discountType).toBe('percentage');
      expect(coupon.discountValue).toBe(50);
      expect(coupon.tenantId.toString()).toBe(tenantA);
    });

    it('should prevent creating a duplicate coupon code within the same tenant', async () => {
      await runWithTenant(tenantA, false, () =>
        couponService.createCoupon({
          code: 'WINTER50',
          discountType: 'percentage',
          discountValue: 50,
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000),
        })
      );

      await expect(
        runWithTenant(tenantA, false, () =>
          couponService.createCoupon({
            code: 'winter50',
            discountType: 'fixed',
            discountValue: 100,
            startDate: new Date(Date.now() - 86400000),
            endDate: new Date(Date.now() + 86400000),
          })
        )
      ).rejects.toThrow('Coupon code already exists in this institute');
    });

    it('should allow the same coupon code to exist in different tenants', async () => {
      const couponA = await runWithTenant(tenantA, false, () =>
        couponService.createCoupon({
          code: 'WINTER50',
          discountType: 'percentage',
          discountValue: 50,
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000),
        })
      );

      const couponB = await runWithTenant(tenantB, false, () =>
        couponService.createCoupon({
          code: 'WINTER50',
          discountType: 'fixed',
          discountValue: 100,
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000),
        })
      );

      expect(couponA.tenantId.toString()).toBe(tenantA);
      expect(couponB.tenantId.toString()).toBe(tenantB);
      expect(couponA.code).toBe('WINTER50');
      expect(couponB.code).toBe('WINTER50');
    });
  });

  describe('validateCoupon', () => {
    let studentId: string;

    beforeEach(async () => {
      const student = await runWithTenant(tenantA, false, () =>
        User.create({
          name: 'Jane Student',
          email: 'jane@student.com',
          password: 'Password123!',
          role: 'student',
          tenantId: tenantA,
        })
      );
      studentId = student._id.toString();
    });

    it('should successfully validate a valid coupon and calculate discount', async () => {
      await runWithTenant(tenantA, false, () =>
        couponService.createCoupon({
          code: 'WELCOME50',
          discountType: 'percentage',
          discountValue: 50,
          minPurchase: 500,
          maxDiscount: 300,
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000),
        })
      );

      const res1 = await runWithTenant(tenantA, false, () =>
        couponService.validateCoupon(studentId, {
          code: 'welcome50',
          amount: 1000,
        })
      );
      // 50% of 1000 = 500. Capped at maxDiscount = 300
      expect(res1.discount).toBe(300);
      expect(res1.finalAmount).toBe(700);

      const res2 = await runWithTenant(tenantA, false, () =>
        couponService.validateCoupon(studentId, {
          code: 'welcome50',
          amount: 400,
        })
      );
      // Below minPurchase (500) -> 0 discount
      expect(res2.discount).toBe(0);
      expect(res2.finalAmount).toBe(400);
    });

    it('should throw bad request for expired or inactive coupons', async () => {
      await runWithTenant(tenantA, false, () =>
        couponService.createCoupon({
          code: 'EXPIRED',
          discountType: 'fixed',
          discountValue: 50,
          isActive: true,
          startDate: new Date(Date.now() - 86400000 * 5),
          endDate: new Date(Date.now() - 86400000),
        })
      );

      await runWithTenant(tenantA, false, () =>
        couponService.createCoupon({
          code: 'INACTIVE',
          discountType: 'fixed',
          discountValue: 50,
          isActive: false,
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000),
        })
      );

      await expect(
        runWithTenant(tenantA, false, () =>
          couponService.validateCoupon(studentId, { code: 'EXPIRED', amount: 100 })
        )
      ).rejects.toThrow('Coupon has expired');

      await expect(
        runWithTenant(tenantA, false, () =>
          couponService.validateCoupon(studentId, { code: 'INACTIVE', amount: 100 })
        )
      ).rejects.toThrow('Coupon is inactive');
    });

    it('should enforce per-user limits', async () => {
      const coupon = await runWithTenant(tenantA, false, () =>
        couponService.createCoupon({
          code: 'ONCEONLY',
          discountType: 'fixed',
          discountValue: 50,
          perUserLimit: 1,
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000),
        })
      );

      // Record one usage
      await runWithTenant(tenantA, false, () => couponService.recordUsage('ONCEONLY', studentId));

      await expect(
        runWithTenant(tenantA, false, () =>
          couponService.validateCoupon(studentId, { code: 'ONCEONLY', amount: 100 })
        )
      ).rejects.toThrow('You have already used this coupon');
    });

    it('should enforce course applicability restrictions', async () => {
      const targetCourse = new mongoose.Types.ObjectId().toString();
      const otherCourse = new mongoose.Types.ObjectId().toString();

      await runWithTenant(tenantA, false, () =>
        couponService.createCoupon({
          code: 'COURSEONLY',
          discountType: 'fixed',
          discountValue: 100,
          applicableCourses: [targetCourse as any],
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000),
        })
      );

      // Validate on incorrect course
      await expect(
        runWithTenant(tenantA, false, () =>
          couponService.validateCoupon(studentId, {
            code: 'COURSEONLY',
            amount: 500,
            courseId: otherCourse,
          })
        )
      ).rejects.toThrow('Coupon not applicable for this course');

      // Validate on correct course
      const res = await runWithTenant(tenantA, false, () =>
        couponService.validateCoupon(studentId, {
          code: 'COURSEONLY',
          amount: 500,
          courseId: targetCourse,
        })
      );
      expect(res.discount).toBe(100);
    });
  });
});
