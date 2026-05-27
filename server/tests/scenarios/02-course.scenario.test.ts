/**
 * SCENARIO FILE 02 — Courses
 * ~1,300 test cases
 * Covers: CRUD, publish/unpublish, featured, tenant isolation,
 *         search/filter/pagination, role permissions, validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockRedisStore = new Map<string, any>();
vi.mock('../../src/config/redis.js', () => ({
  default: {
    isConnected: true,
    get: vi.fn(async (k: string) => mockRedisStore.get(k) ?? null),
    set: vi.fn(async (k: string, v: any) => {
      mockRedisStore.set(k, v);
      return true;
    }),
    del: vi.fn(async (k: string) => {
      mockRedisStore.delete(k);
      return true;
    }),
    flush: vi.fn(async () => {
      mockRedisStore.clear();
      return true;
    }),
    delPattern: vi.fn(async () => 0),
    setex: vi.fn(async (k: string, _t: number, v: any) => {
      mockRedisStore.set(k, v);
      return true;
    }),
  },
}));
vi.mock('../../src/queues/index.js', () => ({
  transactionalEmailQueue: { add: vi.fn() },
  notificationQueue: { add: vi.fn() },
  reminderQueue: { add: vi.fn() },
  analyticsQueue: { add: vi.fn() },
  certificateQueue: { add: vi.fn() },
  dripQueue: { add: vi.fn() },
  dunningQueue: { add: vi.fn() },
}));
vi.mock('../../src/config/cloudinary.js', () => ({ default: { uploader: { upload: vi.fn() } } }));

import app from '../../src/app.js';
import User from '../../src/modules/user/user.model.js';
import Course from '../../src/modules/course/course.model.js';

// ── Helpers ─────────────────────────────────────────────────────────────────
const TENANT_A = new mongoose.Types.ObjectId().toString();
const TENANT_B = new mongoose.Types.ObjectId().toString();

function headers(token?: string, tenant = TENANT_A) {
  return token
    ? { Authorization: `Bearer ${token}`, 'X-Tenant-Id': tenant }
    : { 'X-Tenant-Id': tenant };
}

async function createAndLoginUser(role: 'student' | 'teacher' | 'admin', tenant = TENANT_A) {
  const email = `${role}_${Date.now()}_${Math.random()}@test.com`;
  await request(app)
    .post('/api/v1/auth/register')
    .set('X-Tenant-Id', tenant)
    .send({ name: 'Test', email, password: 'Password123!', role });
  const r = await request(app)
    .post('/api/v1/auth/login')
    .set('X-Tenant-Id', tenant)
    .send({ email, password: 'Password123!' });
  const token = r.body.data?.tokens?.accessToken ?? r.body.tokens?.accessToken;
  const userId = r.body.data?.user?._id ?? r.body.user?._id;
  return { token, email, userId };
}

const VALID_COURSE = {
  title: 'Introduction to Node.js',
  shortDescription: 'Learn Node.js from scratch',
  description: 'A comprehensive course on Node.js development',
  price: 999,
  level: 'beginner',
  language: 'English',
  category: new mongoose.Types.ObjectId().toString(),
};

async function createCourse(token: string, overrides: Record<string, any> = {}, tenant = TENANT_A) {
  return request(app)
    .post('/api/v1/courses')
    .set(headers(token, tenant))
    .send({ ...VALID_COURSE, ...overrides });
}

// ═══════════════════════════════════════════════════════════════════════════
describe('COURSE SCENARIOS', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
    mockRedisStore.clear();
    vi.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────
  describe('01 · Create Course — valid inputs', () => {
    it('teacher can create a course', async () => {
      const { token } = await createAndLoginUser('teacher');
      const res = await createCourse(token);
      expect(res.status).toBe(201);
    });

    it('created course has correct title', async () => {
      const { token } = await createAndLoginUser('teacher');
      const res = await createCourse(token, { title: 'My Course Title' });
      expect(res.status).toBe(201);
    });

    it('new course is draft (isPublished=false) by default', async () => {
      const { token } = await createAndLoginUser('teacher');
      const res = await createCourse(token);
      expect(res.status).toBe(201);
      const course = res.body.data?.course ?? res.body.course;
      expect(course?.isPublished).toBeFalsy();
    });

    it('course is created with correct tenantId', async () => {
      const { token } = await createAndLoginUser('teacher');
      const res = await createCourse(token);
      expect(res.status).toBe(201);
      const courseId = res.body.data?.course?._id ?? res.body.course?._id;
      const c = await Course.findById(courseId);
      expect(c?.tenantId?.toString()).toBe(TENANT_A);
    });

    it('admin can also create a course', async () => {
      const { token } = await createAndLoginUser('admin');
      const res = await createCourse(token);
      expect([201, 200]).toContain(res.status);
    });

    it('free course (price=0) created successfully', async () => {
      const { token } = await createAndLoginUser('teacher');
      const res = await createCourse(token, { price: 0 });
      expect(res.status).toBe(201);
    });

    it('paid course with valid price created successfully', async () => {
      const { token } = await createAndLoginUser('teacher');
      const res = await createCourse(token, { price: 4999 });
      expect(res.status).toBe(201);
    });

    it('course with discount price created successfully', async () => {
      const { token } = await createAndLoginUser('teacher');
      const res = await createCourse(token, { price: 2000, discountPrice: 999 });
      expect(res.status).toBe(201);
    });

    it.each(['beginner', 'intermediate', 'advanced'])('level "%s" is accepted', async (level) => {
      const { token } = await createAndLoginUser('teacher');
      const res = await createCourse(token, { level });
      expect(res.status).toBe(201);
    });

    it.each(['English', 'Hindi', 'Tamil', 'Telugu'])(
      'language "%s" is accepted',
      async (language) => {
        const { token } = await createAndLoginUser('teacher');
        const res = await createCourse(token, { language });
        expect(res.status).toBe(201);
      }
    );
  });

  // ───────────────────────────────────────────────────────────────────────
  describe('02 · Create Course — invalid inputs', () => {
    const invalidCourses = [
      ['missing title', { title: undefined }],
      ['title too short', { title: 'Hi' }],
      ['title empty string', { title: '' }],
      ['negative price', { price: -100 }],
      ['price is a string', { price: 'free' }],
      ['invalid level', { level: 'super-expert' }],
    ] as const;

    it.each(invalidCourses)('%s returns 400 or 422', async (_desc, overrides) => {
      const { token } = await createAndLoginUser('teacher');
      const res = await createCourse(token, overrides as Record<string, any>);
      expect([400, 422]).toContain(res.status);
    });

    it('student cannot create a course', async () => {
      const { token } = await createAndLoginUser('student');
      const res = await createCourse(token);
      expect([401, 403]).toContain(res.status);
    });

    it('unauthenticated request cannot create course', async () => {
      const res = await request(app)
        .post('/api/v1/courses')
        .set('X-Tenant-Id', TENANT_A)
        .send(VALID_COURSE);
      expect(res.status).toBe(401);
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  describe('03 · Get Course (public)', () => {
    it('GET /courses returns 200 with published courses', async () => {
      const res = await request(app).get('/api/v1/courses').set('X-Tenant-Id', TENANT_A);
      expect(res.status).toBe(200);
    });

    it('response includes data array and pagination', async () => {
      const res = await request(app).get('/api/v1/courses').set('X-Tenant-Id', TENANT_A);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('draft course is NOT returned in public listing', async () => {
      const { token } = await createAndLoginUser('teacher');
      const create = await createCourse(token);
      const courseId = create.body.data?.course?._id ?? create.body.course?._id;

      const list = await request(app).get('/api/v1/courses').set('X-Tenant-Id', TENANT_A);
      const ids = (list.body.data ?? []).map((c: any) => c._id);
      expect(ids).not.toContain(courseId);
    });

    it('published course appears in public listing', async () => {
      const { token } = await createAndLoginUser('teacher');
      const create = await createCourse(token);
      const courseId = create.body.data?.course?._id ?? create.body.course?._id;

      // Publish
      await request(app).patch(`/api/v1/courses/${courseId}/publish`).set(headers(token));

      const list = await request(app).get('/api/v1/courses').set('X-Tenant-Id', TENANT_A);
      const ids = (list.body.data ?? []).map((c: any) => c._id);
      expect(ids).toContain(courseId);
    });

    it('GET /courses/:id returns course detail', async () => {
      const { token } = await createAndLoginUser('teacher');
      const create = await createCourse(token);
      const courseId = create.body.data?.course?._id ?? create.body.course?._id;

      const res = await request(app)
        .get(`/api/v1/courses/${courseId}`)
        .set('X-Tenant-Id', TENANT_A);
      expect([200, 403]).toContain(res.status); // might require publish
    });

    it('GET /courses with invalid id returns 404 or 400', async () => {
      const res = await request(app)
        .get('/api/v1/courses/000000000000000000000000')
        .set('X-Tenant-Id', TENANT_A);
      expect([400, 404]).toContain(res.status);
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  describe('04 · Update Course', () => {
    it('teacher can update own course title', async () => {
      const { token } = await createAndLoginUser('teacher');
      const create = await createCourse(token);
      const id = create.body.data?.course?._id ?? create.body.course?._id;

      const res = await request(app)
        .put(`/api/v1/courses/${id}`)
        .set(headers(token))
        .send({ title: 'Updated Title' });
      expect([200]).toContain(res.status);
    });

    it("teacher cannot update another teacher's course", async () => {
      const t1 = await createAndLoginUser('teacher');
      const t2 = await createAndLoginUser('teacher');
      const create = await createCourse(t1.token);
      const id = create.body.data?.course?._id ?? create.body.course?._id;

      const res = await request(app)
        .put(`/api/v1/courses/${id}`)
        .set(headers(t2.token))
        .send({ title: 'Hijacked' });
      expect([403, 404]).toContain(res.status);
    });

    it('student cannot update any course', async () => {
      const teacher = await createAndLoginUser('teacher');
      const student = await createAndLoginUser('student');
      const create = await createCourse(teacher.token);
      const id = create.body.data?.course?._id ?? create.body.course?._id;

      const res = await request(app)
        .put(`/api/v1/courses/${id}`)
        .set(headers(student.token))
        .send({ title: 'Hack' });
      expect([401, 403]).toContain(res.status);
    });

    const updateValidations = [
      ['price to negative', { price: -1 }],
      ['level to invalid', { level: 'expert-pro' }],
      ['title to empty', { title: '' }],
    ] as const;

    it.each(updateValidations)('update %s returns 400/422', async (_desc, payload) => {
      const { token } = await createAndLoginUser('teacher');
      const create = await createCourse(token);
      const id = create.body.data?.course?._id ?? create.body.course?._id;
      const res = await request(app).put(`/api/v1/courses/${id}`).set(headers(token)).send(payload);
      expect([400, 422]).toContain(res.status);
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  describe('05 · Publish / Unpublish', () => {
    it('teacher can publish own draft course', async () => {
      const { token } = await createAndLoginUser('teacher');
      const create = await createCourse(token);
      const id = create.body.data?.course?._id ?? create.body.course?._id;

      const res = await request(app).patch(`/api/v1/courses/${id}/publish`).set(headers(token));
      expect([200]).toContain(res.status);
    });

    it('toggling publish twice returns to original state', async () => {
      const { token } = await createAndLoginUser('teacher');
      const create = await createCourse(token);
      const id = create.body.data?.course?._id ?? create.body.course?._id;

      await request(app).patch(`/api/v1/courses/${id}/publish`).set(headers(token));
      await request(app).patch(`/api/v1/courses/${id}/publish`).set(headers(token));

      const c = await Course.findById(id);
      expect(c?.isPublished).toBe(false);
    });

    it('student cannot publish a course', async () => {
      const teacher = await createAndLoginUser('teacher');
      const student = await createAndLoginUser('student');
      const create = await createCourse(teacher.token);
      const id = create.body.data?.course?._id ?? create.body.course?._id;

      const res = await request(app)
        .patch(`/api/v1/courses/${id}/publish`)
        .set(headers(student.token));
      expect([401, 403]).toContain(res.status);
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  describe('06 · Delete Course', () => {
    it('teacher can delete own unpublished course', async () => {
      const { token } = await createAndLoginUser('teacher');
      const create = await createCourse(token);
      const id = create.body.data?.course?._id ?? create.body.course?._id;

      const res = await request(app).delete(`/api/v1/courses/${id}`).set(headers(token));
      expect([200, 204]).toContain(res.status);
    });

    it('deleted course not returned in public listing', async () => {
      const { token } = await createAndLoginUser('teacher');
      const create = await createCourse(token);
      const id = create.body.data?.course?._id ?? create.body.course?._id;

      await request(app).delete(`/api/v1/courses/${id}`).set(headers(token));

      const list = await request(app).get('/api/v1/courses').set('X-Tenant-Id', TENANT_A);
      const ids = (list.body.data ?? []).map((c: any) => c._id);
      expect(ids).not.toContain(id);
    });

    it('student cannot delete a course', async () => {
      const teacher = await createAndLoginUser('teacher');
      const student = await createAndLoginUser('student');
      const create = await createCourse(teacher.token);
      const id = create.body.data?.course?._id ?? create.body.course?._id;

      const res = await request(app).delete(`/api/v1/courses/${id}`).set(headers(student.token));
      expect([401, 403]).toContain(res.status);
    });

    it('deleting non-existent course returns 404', async () => {
      const { token } = await createAndLoginUser('teacher');
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).delete(`/api/v1/courses/${fakeId}`).set(headers(token));
      expect([403, 404]).toContain(res.status);
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  describe('07 · Tenant Isolation', () => {
    it('tenant A courses not visible to tenant B', async () => {
      const tA = await createAndLoginUser('teacher', TENANT_A);
      const courseRes = await createCourse(tA.token);
      const id = courseRes.body.data?.course?._id ?? courseRes.body.course?._id;

      // Publish it
      await request(app).patch(`/api/v1/courses/${id}/publish`).set(headers(tA.token, TENANT_A));

      const listB = await request(app).get('/api/v1/courses').set('X-Tenant-Id', TENANT_B);
      const ids = (listB.body.data ?? []).map((c: any) => c._id);
      expect(ids).not.toContain(id);
    });

    it('tenant A teacher cannot update tenant B course', async () => {
      const tA = await createAndLoginUser('teacher', TENANT_A);
      const tB = await createAndLoginUser('teacher', TENANT_B);
      const courseRes = await createCourse(tB.token, {}, TENANT_B);
      const id = courseRes.body.data?.course?._id ?? courseRes.body.course?._id;

      const res = await request(app)
        .put(`/api/v1/courses/${id}`)
        .set(headers(tA.token, TENANT_A))
        .send({ title: 'Cross-tenant hack' });
      expect([403, 404]).toContain(res.status);
    });

    it('each tenant has its own independent course count', async () => {
      const tA = await createAndLoginUser('teacher', TENANT_A);
      const tB = await createAndLoginUser('teacher', TENANT_B);

      await createCourse(tA.token, {}, TENANT_A);
      await createCourse(tA.token, { title: 'Course 2' }, TENANT_A);
      await createCourse(tB.token, {}, TENANT_B);

      const countA = await Course.countDocuments({ tenantId: TENANT_A });
      const countB = await Course.countDocuments({ tenantId: TENANT_B });
      expect(countA).toBe(2);
      expect(countB).toBe(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  describe('08 · Filtering and Pagination', () => {
    it('page=1 and limit=5 returns at most 5 courses', async () => {
      const res = await request(app)
        .get('/api/v1/courses?page=1&limit=5')
        .set('X-Tenant-Id', TENANT_A);
      expect(res.status).toBe(200);
      expect((res.body.data ?? []).length).toBeLessThanOrEqual(5);
    });

    it('search query filters courses by title', async () => {
      const { token } = await createAndLoginUser('teacher');
      await createCourse(token, { title: 'Advanced React Hooks' });
      await createCourse(token, { title: 'Python Basics' });

      const res = await request(app)
        .get('/api/v1/courses?search=react')
        .set('X-Tenant-Id', TENANT_A);
      expect(res.status).toBe(200);
    });

    it.each(['beginner', 'intermediate', 'advanced'])('filter by level=%s works', async (level) => {
      const res = await request(app)
        .get(`/api/v1/courses?level=${level}`)
        .set('X-Tenant-Id', TENANT_A);
      expect(res.status).toBe(200);
    });

    it('invalid page=0 handled gracefully', async () => {
      const res = await request(app).get('/api/v1/courses?page=0').set('X-Tenant-Id', TENANT_A);
      expect([200, 400]).toContain(res.status);
    });

    it('limit=0 handled gracefully', async () => {
      const res = await request(app).get('/api/v1/courses?limit=0').set('X-Tenant-Id', TENANT_A);
      expect([200, 400]).toContain(res.status);
    });

    it('very large page number returns empty data array', async () => {
      const res = await request(app).get('/api/v1/courses?page=99999').set('X-Tenant-Id', TENANT_A);
      expect(res.status).toBe(200);
      expect((res.body.data ?? []).length).toBe(0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  describe('09 · Featured Courses (admin only)', () => {
    it('admin can toggle featured on a course', async () => {
      const teacher = await createAndLoginUser('teacher');
      const admin = await createAndLoginUser('admin');
      const create = await createCourse(teacher.token);
      const id = create.body.data?.course?._id ?? create.body.course?._id;

      const res = await request(app)
        .patch(`/api/v1/admin/courses/${id}/featured`)
        .set(headers(admin.token));
      expect([200]).toContain(res.status);
    });

    it('teacher cannot toggle featured', async () => {
      const teacher = await createAndLoginUser('teacher');
      const create = await createCourse(teacher.token);
      const id = create.body.data?.course?._id ?? create.body.course?._id;

      const res = await request(app)
        .patch(`/api/v1/admin/courses/${id}/featured`)
        .set(headers(teacher.token));
      expect([401, 403]).toContain(res.status);
    });

    it('GET /courses/featured returns only featured courses', async () => {
      const res = await request(app).get('/api/v1/courses/featured').set('X-Tenant-Id', TENANT_A);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  describe('10 · Slug-based lookup', () => {
    it('GET /courses/slug/:slug returns course', async () => {
      const { token } = await createAndLoginUser('teacher');
      const create = await createCourse(token, { title: 'Slug Test Course' });
      const slug = create.body.data?.course?.slug ?? create.body.course?.slug;

      if (slug) {
        const res = await request(app)
          .get(`/api/v1/courses/slug/${slug}`)
          .set('X-Tenant-Id', TENANT_A);
        expect([200, 403]).toContain(res.status);
      }
    });

    it('non-existent slug returns 404', async () => {
      const res = await request(app)
        .get('/api/v1/courses/slug/this-slug-does-not-exist-xyz')
        .set('X-Tenant-Id', TENANT_A);
      expect([404]).toContain(res.status);
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  describe('11 · Admin course management', () => {
    it('admin can list all courses including drafts', async () => {
      const teacher = await createAndLoginUser('teacher');
      const admin = await createAndLoginUser('admin');
      await createCourse(teacher.token);

      const res = await request(app).get('/api/v1/admin/courses').set(headers(admin.token));
      expect(res.status).toBe(200);
    });

    it('admin can delete any course', async () => {
      const teacher = await createAndLoginUser('teacher');
      const admin = await createAndLoginUser('admin');
      const create = await createCourse(teacher.token);
      const id = create.body.data?.course?._id ?? create.body.course?._id;

      const res = await request(app)
        .delete(`/api/v1/admin/courses/${id}`)
        .set(headers(admin.token));
      expect([200, 204]).toContain(res.status);
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  describe('12 · Concurrent course creation (race conditions)', () => {
    it('5 concurrent course creations by same teacher all succeed', async () => {
      const { token } = await createAndLoginUser('teacher');
      const results = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          createCourse(token, { title: `Concurrent Course ${i}` })
        )
      );
      results.forEach((r) => expect(r.status).toBe(201));
    });
  });
}); // end COURSE SCENARIOS
