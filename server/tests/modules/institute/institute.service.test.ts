import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { InstituteService } from '../../../src/modules/institute/institute.service.js';
import Institute from '../../../src/modules/institute/institute.model.js';
import User from '../../../src/modules/user/user.model.js';
import SubscriptionPlan from '../../../src/modules/subscription/subscriptionPlan.model.js';
import redis from '../../../src/config/redis.js';
import { updateBrandingSchema } from '../../../src/modules/institute/institute.validation.js';

describe('InstituteService & Validation', () => {
  let instituteService: InstituteService;

  beforeEach(async () => {
    instituteService = new InstituteService();
    await Institute.deleteMany({});
    await User.deleteMany({});
    await SubscriptionPlan.deleteMany({});
    await redis.flush();
    vi.clearAllMocks();
  });

  describe('Validation - Color Contrast', () => {
    it('should validate theme colors with good contrast ratio', () => {
      const payload = {
        theme: {
          primaryColor: '#3b82f6',
          secondaryColor: '#1e3a8a',
        },
      };

      const result = updateBrandingSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject theme colors with low contrast ratio', () => {
      const payload = {
        theme: {
          primaryColor: '#3b82f6',
          secondaryColor: '#3b82f6', // 1:1 contrast ratio
        },
      };

      const result = updateBrandingSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Primary and secondary branding colors must have distinct contrast ratios'
        );
      }
    });
  });

  describe('Subdomain Resolution & Onboarding', () => {
    it('should onboard a new institute and create its admin owner', async () => {
      const result = await instituteService.onboardInstitute({
        name: 'Alpha Coaching',
        subdomain: 'alpha',
        adminName: 'Owner User',
        adminEmail: 'owner@alpha.com',
        adminPassword: 'Password123!',
      });

      expect(result.institute.name).toBe('Alpha Coaching');
      expect(result.institute.subdomain).toBe('alpha');
      expect(result.admin.name).toBe('Owner User');
      expect(result.admin.email).toBe('owner@alpha.com');
      expect(result.token).toBeDefined();

      const inst = await Institute.findOne({ subdomain: 'alpha' });
      expect(inst).toBeDefined();
      expect(inst!.name).toBe('Alpha Coaching');

      const admin = await User.findOne({ email: 'owner@alpha.com' });
      expect(admin).toBeDefined();
      expect(admin!.role).toBe('admin');
      expect(admin!.tenantId.toString()).toBe(inst!._id.toString());
    });

    it('should check subdomain availability correctly', async () => {
      await Institute.create({
        name: 'Alpha Coaching',
        subdomain: 'alpha',
        owner: new mongoose.Types.ObjectId(),
        subscription: {
          plan: new mongoose.Types.ObjectId(),
          status: 'active',
          expiresAt: new Date(Date.now() + 100000),
        },
        limits: {
          studentLimit: 100,
          teacherLimit: 5,
          storageLimit: 10000,
        },
      });

      const check1 = await instituteService.checkSubdomain('alpha');
      expect(check1.available).toBe(false);

      const check2 = await instituteService.checkSubdomain('beta');
      expect(check2.available).toBe(true);

      const check3 = await instituteService.checkSubdomain('api'); // reserved
      expect(check3.available).toBe(false);
    });
  });
});
