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
    delPattern: vi.fn(async (pattern: string) => {
      for (const k of mockRedisStore.keys()) {
        if (k.startsWith(pattern.replace('*', ''))) {
          mockRedisStore.delete(k);
        }
      }
      return true;
    }),
    flush: vi.fn(async () => {
      mockRedisStore.clear();
      return true;
    }),
  },
}));

import { ReviewService } from '../../../src/modules/review/review.service.js';
import Review from '../../../src/modules/review/review.model.js';
import Course from '../../../src/modules/course/course.model.js';
import User from '../../../src/modules/user/user.model.js';
import Enrollment from '../../../src/modules/enrollment/enrollment.model.js';
import redis from '../../../src/config/redis.js';
import { runWithTenant } from '../../../src/core/tenant.context.js';

describe('ReviewService', () => {
  let reviewService: ReviewService;
  const mockTenantId = new mongoose.Types.ObjectId().toString();

  let studentId: string;
  let teacherId: string;
  let courseId: string;

  beforeEach(async () => {
    reviewService = new ReviewService();
    await Review.deleteMany({});
    await Course.deleteMany({});
    await User.deleteMany({});
    await Enrollment.deleteMany({});
    await redis.flush();
    vi.clearAllMocks();

    // Create a student and a teacher
    const student = await runWithTenant(mockTenantId, false, () =>
      User.create({
        name: 'Jane Student',
        email: 'jane@student.com',
        password: 'Password123!',
        role: 'student',
        tenantId: mockTenantId,
      })
    );
    studentId = student._id.toString();

    const teacher = await runWithTenant(mockTenantId, false, () =>
      User.create({
        name: 'John Teacher',
        email: 'john@teacher.com',
        password: 'Password123!',
        role: 'teacher',
        tenantId: mockTenantId,
      })
    );
    teacherId = teacher._id.toString();

    // Create a course
    const course = await runWithTenant(mockTenantId, false, () =>
      Course.create({
        title: 'Mastering TypeScript',
        description: 'Deep dive into advanced TypeScript concepts.',
        teacher: teacher._id,
        category: new mongoose.Types.ObjectId(),
        price: 500,
        tenantId: mockTenantId,
      })
    );
    courseId = course._id.toString();
  });

  describe('createReview', () => {
    it('should throw error if user is not enrolled in the course', async () => {
      await expect(
        runWithTenant(mockTenantId, false, () =>
          reviewService.createReview(studentId, {
            course: courseId,
            rating: 5,
            comment: 'Absolutely amazing course! Learned a lot.',
          })
        )
      ).rejects.toThrow('You must be enrolled to review this course');
    });

    it('should create review successfully and calculate course average rating', async () => {
      // Create active enrollment
      await runWithTenant(mockTenantId, false, () =>
        Enrollment.create({
          user: studentId,
          course: courseId,
          status: 'active',
          tenantId: mockTenantId,
        })
      );

      const review = await runWithTenant(mockTenantId, false, () =>
        reviewService.createReview(studentId, {
          course: courseId,
          rating: 5,
          comment: 'Absolutely amazing course! Learned a lot.',
        })
      );

      expect(review).toBeDefined();
      expect(review.rating).toBe(5);
      expect(review.comment).toBe('Absolutely amazing course! Learned a lot.');
      expect(review.user._id.toString()).toBe(studentId);

      // Verify Course rating aggregation
      const courseDoc = await runWithTenant(mockTenantId, false, () => Course.findById(courseId));
      expect(courseDoc?.averageRating).toBe(5);
      expect(courseDoc?.totalReviews).toBe(1);
    });

    it('should throw conflict error if user has already reviewed the course', async () => {
      // Create active enrollment
      await runWithTenant(mockTenantId, false, () =>
        Enrollment.create({
          user: studentId,
          course: courseId,
          status: 'active',
          tenantId: mockTenantId,
        })
      );

      // Create first review
      await runWithTenant(mockTenantId, false, () =>
        reviewService.createReview(studentId, {
          course: courseId,
          rating: 4,
          comment: 'Good course with clean explanations.',
        })
      );

      // Attempt duplicate review
      await expect(
        runWithTenant(mockTenantId, false, () =>
          reviewService.createReview(studentId, {
            course: courseId,
            rating: 5,
            comment: 'Wait, let me change my rating to 5.',
          })
        )
      ).rejects.toThrow('You have already reviewed this course');
    });
  });

  describe('updateReview', () => {
    it('should update review successfully and recalculate course average rating', async () => {
      // Create enrollment and review
      await runWithTenant(mockTenantId, false, () =>
        Enrollment.create({
          user: studentId,
          course: courseId,
          status: 'active',
          tenantId: mockTenantId,
        })
      );

      const review = await runWithTenant(mockTenantId, false, () =>
        reviewService.createReview(studentId, {
          course: courseId,
          rating: 4,
          comment: 'Good course with clean explanations.',
        })
      );

      // Update review to 5 stars
      const updated = await runWithTenant(mockTenantId, false, () =>
        reviewService.updateReview(review._id.toString(), studentId, {
          rating: 5,
          comment: 'Updating rating. Very awesome support!',
        })
      );

      expect(updated.rating).toBe(5);
      expect(updated.comment).toBe('Updating rating. Very awesome support!');

      // Verify Course rating aggregation is updated
      const courseDoc = await runWithTenant(mockTenantId, false, () => Course.findById(courseId));
      expect(courseDoc?.averageRating).toBe(5);
    });
  });

  describe('deleteReview', () => {
    it('should delete review successfully and reset course rating', async () => {
      await runWithTenant(mockTenantId, false, () =>
        Enrollment.create({
          user: studentId,
          course: courseId,
          status: 'active',
          tenantId: mockTenantId,
        })
      );

      const review = await runWithTenant(mockTenantId, false, () =>
        reviewService.createReview(studentId, {
          course: courseId,
          rating: 4,
          comment: 'Good course with clean explanations.',
        })
      );

      // Delete review
      await runWithTenant(mockTenantId, false, () =>
        reviewService.deleteReview(review._id.toString(), studentId)
      );

      const reviewDoc = await runWithTenant(mockTenantId, false, () => Review.findById(review._id));
      expect(reviewDoc).toBeNull();

      // Verify Course rating is reset
      const courseDoc = await runWithTenant(mockTenantId, false, () => Course.findById(courseId));
      expect(courseDoc?.averageRating).toBe(0);
      expect(courseDoc?.totalReviews).toBe(0);
    });
  });
});
