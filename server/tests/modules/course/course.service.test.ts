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
    delPattern: vi.fn(async () => {
      mockRedisStore.clear();
      return true;
    }),
    flush: vi.fn(async () => {
      mockRedisStore.clear();
      return true;
    }),
  },
}));

import { CourseService } from '../../../src/modules/course/course.service.js';
import Course from '../../../src/modules/course/course.model.js';
import redis from '../../../src/config/redis.js';
import { runWithTenant } from '../../../src/core/tenant.context.js';

describe('CourseService & Calculations', () => {
  let courseService: CourseService;
  const mockTenantId = new mongoose.Types.ObjectId().toString();
  const teacherId = new mongoose.Types.ObjectId();
  const categoryId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    courseService = new CourseService();
    await Course.deleteMany({});
    await redis.flush();
    vi.clearAllMocks();
  });

  describe('Create & Slugs', () => {
    it('should generate slug and calculate effectivePrice', async () => {
      const course = await runWithTenant(mockTenantId, false, () =>
        courseService.createCourse(
          {
            title: 'Introduction to Physics 101',
            description:
              'Learn the basics of mechanics, gravity, and relativity in this physics course.',
            category: categoryId.toString(),
            price: 500,
            discountPrice: 299,
          },
          teacherId.toString()
        )
      );

      expect(course.slug).toMatch(/^introduction-to-physics-101-[a-f0-9]{6}$/);
      expect(course.effectivePrice).toBe(299);
      expect(course.isFree).toBe(false);
      expect(course.tenantId.toString()).toBe(mockTenantId);
    });

    it('should calculate isFree: true when effectivePrice is 0', async () => {
      const course = await runWithTenant(mockTenantId, false, () =>
        courseService.createCourse(
          {
            title: 'Free Chemistry Seminar',
            description: 'Free chemistry tutorial covering basics of molecular structures.',
            category: categoryId.toString(),
            price: 0,
          },
          teacherId.toString()
        )
      );

      expect(course.effectivePrice).toBe(0);
      expect(course.isFree).toBe(true);
    });
  });

  describe('Pre-save totals calculations', () => {
    it('should automatically compute total lessons and total duration from nested sections', async () => {
      const course = await runWithTenant(mockTenantId, false, () =>
        courseService.createCourse(
          {
            title: 'Algebra Special Course',
            description: 'Advanced algebra course covering matrices and determinants.',
            category: categoryId.toString(),
            price: 100,
            sections: [
              {
                title: 'Section 1: Basics',
                lessons: [
                  { title: 'Lesson 1.1', type: 'video', duration: 300, isFree: true },
                  { title: 'Lesson 1.2', type: 'text', duration: 120 },
                ],
              },
              {
                title: 'Section 2: Intermediate',
                lessons: [{ title: 'Lesson 2.1', type: 'video', duration: 600 }],
              },
            ],
          },
          teacherId.toString()
        )
      );

      expect(course.totalLessons).toBe(3);
      expect(course.totalDuration).toBe(1020);
    });
  });

  describe('Publish constraints', () => {
    it('should block publishing draft course without thumbnail or sections', async () => {
      const course = await runWithTenant(mockTenantId, false, () =>
        courseService.createCourse(
          {
            title: 'Algebra Special Course',
            description: 'Advanced algebra course covering matrices and determinants.',
            category: categoryId.toString(),
          },
          teacherId.toString()
        )
      );

      await expect(
        runWithTenant(mockTenantId, false, () =>
          courseService.publishCourse(course._id.toString(), teacherId.toString())
        )
      ).rejects.toThrow('Course must have at least one section');
    });
  });
});
