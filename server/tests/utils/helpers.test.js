import { describe, it, expect } from 'vitest';
import {
  generateSlug,
  generateOTP,
  generateToken,
  calculatePercentage,
  formatCurrency,
  sanitizeUser,
  pick,
  omit,
  sleep,
  getDateRange,
} from '../../src/utils/helpers.js';

describe('Helpers Utility', () => {
  describe('generateSlug', () => {
    it('should generate a slug from text', () => {
      const slug = generateSlug('Hello World  123!');
      expect(slug).toMatch(/^hello-world-123-[a-f0-9]{6}$/);
    });

    it('should handle special characters', () => {
      const slug = generateSlug('Test@#$%^&*()_+Slug');
      expect(slug).toMatch(/^test_slug-[a-f0-9]{6}$/);
    });
  });

  describe('generateOTP', () => {
    it('should generate a 6-digit OTP by default', () => {
      const otp = generateOTP();
      expect(otp).toMatch(/^[0-9]{6}$/);
    });

    it('should generate an OTP of specified length', () => {
      const otp = generateOTP(4);
      expect(otp).toMatch(/^[0-9]{4}$/);
    });
  });

  describe('generateToken', () => {
    it('should generate a 64-character hex token by default (32 bytes)', () => {
      const token = generateToken();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate a token of specified bytes', () => {
      const token = generateToken(16);
      expect(token).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(50, 200)).toBe(25);
    });

    it('should return 0 if total is 0 or falsy', () => {
      expect(calculatePercentage(50, 0)).toBe(0);
      expect(calculatePercentage(50, null)).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly as INR by default', () => {
      const formatted = formatCurrency(1000);
      // Depending on Node version, exact output might vary slightly, but it contains ₹
      expect(formatted).toContain('₹');
      expect(formatted).toContain('1,000');
    });

    it('should format currency for specified currency', () => {
      const formatted = formatCurrency(1000, 'USD');
      expect(formatted).toContain('$');
      expect(formatted).toContain('1,000');
    });
  });

  describe('sanitizeUser', () => {
    it('should return null if user is falsy', () => {
      expect(sanitizeUser(null)).toBeNull();
    });

    it('should remove sensitive fields from user object', () => {
      const user = {
        name: 'Test',
        password: 'hashedpassword',
        refreshTokens: ['token'],
        __v: 0,
        resetPasswordToken: 'token',
        resetPasswordExpire: Date.now(),
        emailVerificationToken: 'token',
      };
      
      const sanitized = sanitizeUser(user);
      
      expect(sanitized.name).toBe('Test');
      expect(sanitized.password).toBeUndefined();
      expect(sanitized.refreshTokens).toBeUndefined();
      expect(sanitized.__v).toBeUndefined();
      expect(sanitized.resetPasswordToken).toBeUndefined();
      expect(sanitized.resetPasswordExpire).toBeUndefined();
      expect(sanitized.emailVerificationToken).toBeUndefined();
    });

    it('should handle Mongoose document (toObject method)', () => {
      const userDoc = {
        toObject: () => ({ name: 'Test', password: 'pass' })
      };
      const sanitized = sanitizeUser(userDoc);
      expect(sanitized.name).toBe('Test');
      expect(sanitized.password).toBeUndefined();
    });
  });

  describe('pick', () => {
    it('should pick specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const picked = pick(obj, ['a', 'c']);
      expect(picked).toEqual({ a: 1, c: 3 });
    });

    it('should ignore keys not in object', () => {
      const obj = { a: 1 };
      const picked = pick(obj, ['a', 'b']);
      expect(picked).toEqual({ a: 1 });
    });
  });

  describe('omit', () => {
    it('should omit specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const omitted = omit(obj, ['b']);
      expect(omitted).toEqual({ a: 1, c: 3 });
    });
  });

  describe('sleep', () => {
    it('should resolve after specified ms', async () => {
      const start = Date.now();
      await sleep(50);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(49);
    });
  });

  describe('getDateRange', () => {
    it('should return correct start and end for week', () => {
      const range = getDateRange('week');
      expect(range.start).toBeInstanceOf(Date);
      expect(range.end).toBeInstanceOf(Date);
      // Rough check if start is before end
      expect(range.start.getTime()).toBeLessThan(range.end.getTime());
    });

    it('should default to month if period is unknown', () => {
      const defaultRange = getDateRange('unknown');
      const monthRange = getDateRange('month');
      // They should represent the same start date
      expect(defaultRange.start.getFullYear()).toBe(monthRange.start.getFullYear());
      expect(defaultRange.start.getMonth()).toBe(monthRange.start.getMonth());
    });
  });
});
