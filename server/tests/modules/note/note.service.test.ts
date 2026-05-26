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

import { NoteService } from '../../../src/modules/note/note.service.js';
import Note from '../../../src/modules/note/note.model.js';
import User from '../../../src/modules/user/user.model.js';
import Course from '../../../src/modules/course/course.model.js';
import { runWithTenant } from '../../../src/core/tenant.context.js';

describe('NoteService', () => {
  let noteService: NoteService;
  const mockTenantId = new mongoose.Types.ObjectId().toString();
  let studentId: string;
  let courseId: string;

  beforeEach(async () => {
    noteService = new NoteService();
    await Note.deleteMany({});
    await User.deleteMany({});
    await Course.deleteMany({});
    vi.clearAllMocks();

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

  describe('createNote', () => {
    it('should create a note with default color and timestamp', async () => {
      const note = await runWithTenant(mockTenantId, false, () =>
        noteService.createNote(studentId, courseId, {
          content: 'This is an important concept.',
        })
      );

      expect(note).toBeDefined();
      expect(note.content).toBe('This is an important concept.');
      expect(note.color).toBe('#FFD700');
      expect(note.timestamp).toBe(0);
      expect(note.isPinned).toBe(false);
      expect(note.user.toString()).toBe(studentId);
      expect(note.course.toString()).toBe(courseId);
    });

    it('should create a note with a video timestamp and custom color', async () => {
      const note = await runWithTenant(mockTenantId, false, () =>
        noteService.createNote(studentId, courseId, {
          content: 'Async/Await explained at this point.',
          timestamp: 345,
          color: '#FF5733',
        })
      );

      expect(note.timestamp).toBe(345);
      expect(note.color).toBe('#FF5733');
    });
  });

  describe('getNotes', () => {
    it('should return paginated notes filtered by user and course', async () => {
      // Create 3 notes for student
      await runWithTenant(mockTenantId, false, () =>
        Promise.all([
          noteService.createNote(studentId, courseId, { content: 'Note 1' }),
          noteService.createNote(studentId, courseId, { content: 'Note 2' }),
          noteService.createNote(studentId, courseId, { content: 'Note 3' }),
        ])
      );

      const result = await runWithTenant(mockTenantId, false, () =>
        noteService.getNotes(studentId, courseId, { page: 1, limit: 10 })
      );

      expect(result.docs).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should enforce per-user isolation — other students cannot see each other notes', async () => {
      const student2 = await runWithTenant(mockTenantId, false, () =>
        User.create({
          name: 'Bob Student',
          email: 'bob@student.com',
          password: 'Password123!',
          role: 'student',
          tenantId: mockTenantId,
        })
      );

      await runWithTenant(mockTenantId, false, () =>
        noteService.createNote(studentId, courseId, { content: 'Jane secret note.' })
      );

      const bobNotes = await runWithTenant(mockTenantId, false, () =>
        noteService.getNotes(student2._id.toString(), courseId, { page: 1, limit: 10 })
      );

      expect(bobNotes.docs).toHaveLength(0);
    });
  });

  describe('updateNote', () => {
    it('should update note content, color, and pinned status', async () => {
      const note = await runWithTenant(mockTenantId, false, () =>
        noteService.createNote(studentId, courseId, { content: 'Draft note.' })
      );

      const updated = await runWithTenant(mockTenantId, false, () =>
        noteService.updateNote(note._id.toString(), studentId, {
          content: 'Updated note content.',
          color: '#00FF00',
          isPinned: true,
        })
      );

      expect(updated.content).toBe('Updated note content.');
      expect(updated.color).toBe('#00FF00');
      expect(updated.isPinned).toBe(true);
    });

    it('should throw not found if user tries to update another user note', async () => {
      const note = await runWithTenant(mockTenantId, false, () =>
        noteService.createNote(studentId, courseId, { content: 'Jane note.' })
      );

      const otherUserId = new mongoose.Types.ObjectId().toString();
      await expect(
        runWithTenant(mockTenantId, false, () =>
          noteService.updateNote(note._id.toString(), otherUserId, {
            content: 'Trying to overwrite.',
          })
        )
      ).rejects.toThrow('Note not found');
    });
  });

  describe('deleteNote', () => {
    it('should delete note and verify it is removed from DB', async () => {
      const note = await runWithTenant(mockTenantId, false, () =>
        noteService.createNote(studentId, courseId, { content: 'To be deleted.' })
      );

      await runWithTenant(mockTenantId, false, () =>
        noteService.deleteNote(note._id.toString(), studentId)
      );

      const found = await runWithTenant(mockTenantId, false, () => Note.findById(note._id));
      expect(found).toBeNull();
    });

    it('should throw not found if user tries to delete another user note', async () => {
      const note = await runWithTenant(mockTenantId, false, () =>
        noteService.createNote(studentId, courseId, { content: 'Jane note.' })
      );

      const otherUserId = new mongoose.Types.ObjectId().toString();
      await expect(
        runWithTenant(mockTenantId, false, () =>
          noteService.deleteNote(note._id.toString(), otherUserId)
        )
      ).rejects.toThrow('Note not found');
    });
  });
});
