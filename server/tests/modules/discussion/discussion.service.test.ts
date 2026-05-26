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

import { DiscussionService } from '../../../src/modules/discussion/discussion.service.js';
import Discussion from '../../../src/modules/discussion/discussion.model.js';
import Course from '../../../src/modules/course/course.model.js';
import User from '../../../src/modules/user/user.model.js';
import Enrollment from '../../../src/modules/enrollment/enrollment.model.js';
import { runWithTenant } from '../../../src/core/tenant.context.js';

describe('DiscussionService', () => {
  let discussionService: DiscussionService;
  const mockTenantId = new mongoose.Types.ObjectId().toString();

  let studentId: string;
  let teacherId: string;
  let courseId: string;

  beforeEach(async () => {
    discussionService = new DiscussionService();
    await Discussion.deleteMany({});
    await Course.deleteMany({});
    await User.deleteMany({});
    await Enrollment.deleteMany({});
    vi.clearAllMocks();

    // Create users
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

  describe('createDiscussion', () => {
    it('should throw error if student is not enrolled in the course', async () => {
      await expect(
        runWithTenant(mockTenantId, false, () =>
          discussionService.createDiscussion(studentId, 'student', courseId, {
            title: 'Types vs Interfaces',
            content: 'Which one should I prefer?',
          })
        )
      ).rejects.toThrow('You must be enrolled to participate in discussions');
    });

    it('should create discussion successfully if student is enrolled', async () => {
      await runWithTenant(mockTenantId, false, () =>
        Enrollment.create({
          user: studentId,
          course: courseId,
          status: 'active',
          tenantId: mockTenantId,
        })
      );

      const discussion = await runWithTenant(mockTenantId, false, () =>
        discussionService.createDiscussion(studentId, 'student', courseId, {
          title: 'Types vs Interfaces',
          content: 'Which one should I prefer?',
          tags: ['typescript', 'design'],
        })
      );

      expect(discussion).toBeDefined();
      expect(discussion.title).toBe('Types vs Interfaces');
      expect(discussion.tags).toContain('typescript');
      expect(discussion.user._id.toString()).toBe(studentId);
    });

    it('should allow teacher to create discussion without enrollment', async () => {
      const discussion = await runWithTenant(mockTenantId, false, () =>
        discussionService.createDiscussion(teacherId, 'teacher', courseId, {
          title: 'Welcome to the Course!',
          content: 'Post your queries here.',
        })
      );

      expect(discussion).toBeDefined();
      expect(discussion.title).toBe('Welcome to the Course!');
      expect(discussion.user._id.toString()).toBe(teacherId);
    });
  });

  describe('updateDiscussion', () => {
    it('should update discussion fields successfully', async () => {
      const discussion = await runWithTenant(mockTenantId, false, () =>
        discussionService.createDiscussion(teacherId, 'teacher', courseId, {
          title: 'Initial Title',
          content: 'Initial Content',
        })
      );

      const updated = await runWithTenant(mockTenantId, false, () =>
        discussionService.updateDiscussion(discussion._id.toString(), teacherId, {
          title: 'Updated Title',
          content: 'Updated Content',
        })
      );

      expect(updated.title).toBe('Updated Title');
      expect(updated.content).toBe('Updated Content');
    });
  });

  describe('replies', () => {
    it('should add a reply and update it successfully', async () => {
      const discussion = await runWithTenant(mockTenantId, false, () =>
        discussionService.createDiscussion(teacherId, 'teacher', courseId, {
          title: 'Thread 1',
          content: 'First Thread',
        })
      );

      const reply = await runWithTenant(mockTenantId, false, () =>
        discussionService.addReply(discussion._id.toString(), studentId, {
          content: 'This is my response.',
        })
      );

      expect(reply.content).toBe('This is my response.');
      expect((reply.user as any)._id.toString()).toBe(studentId);

      const updatedReply = await runWithTenant(mockTenantId, false, () =>
        discussionService.updateReply(discussion._id.toString(), reply._id.toString(), studentId, {
          content: 'My updated response.',
        })
      );

      expect(updatedReply.content).toBe('My updated response.');
    });
  });

  describe('likes & resolved status', () => {
    it('should toggle likes and resolved flags', async () => {
      const discussion = await runWithTenant(mockTenantId, false, () =>
        discussionService.createDiscussion(teacherId, 'teacher', courseId, {
          title: 'Thread 1',
          content: 'First Thread',
        })
      );

      // Like
      const likeRes1 = await runWithTenant(mockTenantId, false, () =>
        discussionService.toggleLike(discussion._id.toString(), studentId)
      );
      expect(likeRes1.isLiked).toBe(true);
      expect(likeRes1.likeCount).toBe(1);

      // Unlike
      const likeRes2 = await runWithTenant(mockTenantId, false, () =>
        discussionService.toggleLike(discussion._id.toString(), studentId)
      );
      expect(likeRes2.isLiked).toBe(false);
      expect(likeRes2.likeCount).toBe(0);

      // Resolve
      const resolved = await runWithTenant(mockTenantId, false, () =>
        discussionService.toggleResolved(discussion._id.toString(), teacherId, 'teacher')
      );
      expect(resolved).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete discussion thread and replies successfully', async () => {
      const discussion = await runWithTenant(mockTenantId, false, () =>
        discussionService.createDiscussion(teacherId, 'teacher', courseId, {
          title: 'Thread 1',
          content: 'First Thread',
        })
      );

      const reply = await runWithTenant(mockTenantId, false, () =>
        discussionService.addReply(discussion._id.toString(), studentId, {
          content: 'Response.',
        })
      );

      // Delete reply
      await runWithTenant(mockTenantId, false, () =>
        discussionService.deleteReply(
          discussion._id.toString(),
          reply._id.toString(),
          studentId,
          'student'
        )
      );

      // Verify reply is deleted
      const docAfterReplyDelete = await runWithTenant(mockTenantId, false, () =>
        Discussion.findById(discussion._id)
      );
      expect(docAfterReplyDelete?.replies).toHaveLength(0);

      // Delete thread
      await runWithTenant(mockTenantId, false, () =>
        discussionService.deleteDiscussion(discussion._id.toString(), teacherId, 'teacher')
      );

      const deletedDoc = await runWithTenant(mockTenantId, false, () =>
        Discussion.findById(discussion._id)
      );
      expect(deletedDoc).toBeNull();
    });
  });
});
