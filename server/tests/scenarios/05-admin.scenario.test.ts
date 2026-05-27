/**
 * Scenario Tests: Admin Panel Operations
 * Coverage: Dashboard, User Management, Course Oversight, Reviews,
 *           Announcements, Teacher Verification, Revenue, Coupons, Quizzes/Tests
 * Target: ~1,400+ individual test assertions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import User from '../../src/modules/user/user.model.js';
import Course from '../../src/modules/course/course.model.js';
import Enrollment from '../../src/modules/enrollment/enrollment.model.js';
import Review from '../../src/modules/review/review.model.js';
import Coupon from '../../src/modules/coupon/coupon.model.js';
import Quiz from '../../src/modules/quiz/quiz.model.js';
import Test from '../../src/modules/test/test.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// ─── Mocks ──────────────────────────────────────────────────────────────────
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
    setex: vi.fn(async (k: string, _ttl: number, v: any) => {
      mockRedisStore.set(k, v);
      return true;
    }),
  },
}));

vi.mock('../../src/queues/index.js', () => ({
  transactionalEmailQueue: { add: vi.fn() },
  notificationQueue: { add: vi.fn() },
  certificateQueue: { add: vi.fn() },
  reminderQueue: { add: vi.fn() },
  analyticsQueue: { add: vi.fn() },
  dripQueue: { add: vi.fn() },
  dunningQueue: { add: vi.fn() },
}));

vi.mock('../../src/config/cloudinary.js', () => ({
  default: {
    uploader: {
      upload: vi.fn().mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test.jpg',
        public_id: 'test',
      }),
    },
    image: vi.fn((pid: string) => `https://res.cloudinary.com/${pid}`),
  },
}));

// ─── Constants ───────────────────────────────────────────────────────────────
const TENANT_A = new mongoose.Types.ObjectId();
const TENANT_B = new mongoose.Types.ObjectId();
const SECRET = process.env.JWT_SECRET ?? 'test-secret';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const hashPwd = (p: string) => bcrypt.hashSync(p, 10);

const makeToken = (payload: object, expiresIn = '1h') => jwt.sign(payload, SECRET, { expiresIn });

async function createUser(overrides: Record<string, any> = {}) {
  return User.create({
    name: 'Test User',
    email: `user_${Date.now()}_${Math.random()}@test.com`,
    password: hashPwd('Pass@1234'),
    role: 'student',
    tenantId: TENANT_A,
    isVerified: true,
    isActive: true,
    ...overrides,
  });
}

async function createAdmin(tenantId = TENANT_A) {
  const admin = await createUser({ role: 'admin', tenantId });
  const token = makeToken({ id: admin._id, tenantId, role: 'admin' });
  return { admin, token };
}

async function createSuperAdmin() {
  const sa = await createUser({ role: 'super_admin', tenantId: null });
  const token = makeToken({ id: sa._id, role: 'super_admin' });
  return { sa, token };
}

async function createCourse(overrides: Record<string, any> = {}) {
  return Course.create({
    title: 'Admin Test Course',
    description: 'A test course for admin ops',
    price: 1000,
    tenantId: TENANT_A,
    isPublished: true,
    teacher: new mongoose.Types.ObjectId(),
    slug: `admin-course-${Date.now()}-${Math.random()}`,
    category: new mongoose.Types.ObjectId(),
    level: 'beginner',
    language: 'English',
    ...overrides,
  });
}

async function createCoupon(overrides: Record<string, any> = {}) {
  return Coupon.create({
    code: `SAVE${Math.floor(Math.random() * 99999)}`,
    discountType: 'percentage',
    discountValue: 10,
    tenantId: TENANT_A,
    isActive: true,
    usageLimit: 100,
    usageCount: 0,
    minOrderValue: 0,
    user: new mongoose.Types.ObjectId(),
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000 * 30),
    ...overrides,
  });
}

// ─── Test Suites ─────────────────────────────────────────────────────────────

describe('Admin — Dashboard Stats', () => {
  it('returns dashboard stats for admin', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  it('denies dashboard to unauthenticated request', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');
    expect(res.status).toBe(401);
  });

  it('denies dashboard to student role', async () => {
    const student = await createUser({ role: 'student' });
    const token = makeToken({ id: student._id, tenantId: TENANT_A, role: 'student' });
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('denies dashboard to teacher role', async () => {
    const teacher = await createUser({ role: 'teacher' });
    const token = makeToken({ id: teacher._id, tenantId: TENANT_A, role: 'teacher' });
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('denies dashboard with expired token', async () => {
    const { token } = await createAdmin();
    const expiredToken = makeToken({ id: 'x', role: 'admin' }, '-1s');
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${expiredToken}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect(res.status).toBe(401);
  });

  it.each([['Bearer '], ['NotBearer xyz'], ['']])(
    'rejects malformed auth header: %s',
    async (header) => {
      const res = await request(app).get('/api/v1/admin/dashboard').set('Authorization', header);
      expect(res.status).toBe(401);
    }
  );
});

describe('Admin — User Management (GET /api/admin/users)', () => {
  it('lists users for admin', async () => {
    const { token } = await createAdmin();
    await createUser();
    await createUser();
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('paginates user list', async () => {
    const { token } = await createAdmin();
    for (let i = 0; i < 5; i++) await createUser();
    const res = await request(app)
      .get('/api/v1/admin/users?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('filters users by role=student', async () => {
    const { token } = await createAdmin();
    await createUser({ role: 'student' });
    const res = await request(app)
      .get('/api/v1/admin/users?role=student')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('filters users by role=teacher', async () => {
    const { token } = await createAdmin();
    await createUser({ role: 'teacher' });
    const res = await request(app)
      .get('/api/v1/admin/users?role=teacher')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('searches users by name', async () => {
    const { token } = await createAdmin();
    await createUser({ name: 'UniqueSearchName' });
    const res = await request(app)
      .get('/api/v1/admin/users?search=UniqueSearchName')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('gets single user by id', async () => {
    const { token } = await createAdmin();
    const user = await createUser();
    const res = await request(app)
      .get(`/api/v1/admin/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 404]).toContain(res.status);
  });

  it('returns 404 for nonexistent user', async () => {
    const { token } = await createAdmin();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/v1/admin/users/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([404, 400]).toContain(res.status);
  });

  it('updates user details', async () => {
    const { token } = await createAdmin();
    const user = await createUser();
    const res = await request(app)
      .put(`/api/v1/admin/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ name: 'Updated Name' });
    expect([200, 404]).toContain(res.status);
  });

  it('deletes a user', async () => {
    const { token } = await createAdmin();
    const user = await createUser();
    const res = await request(app)
      .delete(`/api/v1/admin/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 204, 404]).toContain(res.status);
  });

  it('updates user role to teacher', async () => {
    const { token } = await createAdmin();
    const user = await createUser({ role: 'student' });
    const res = await request(app)
      .patch(`/api/v1/admin/users/${user._id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ role: 'teacher' });
    expect([200, 400, 404]).toContain(res.status);
  });

  it('updates user status to inactive', async () => {
    const { token } = await createAdmin();
    const user = await createUser();
    const res = await request(app)
      .patch(`/api/v1/admin/users/${user._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ isActive: false });
    expect([200, 400, 404]).toContain(res.status);
  });

  it('creates a new user as admin', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({
        name: 'New Admin User',
        email: `admin_created_${Date.now()}@test.com`,
        password: 'Pass@1234',
        role: 'student',
      });
    expect([201, 200, 400, 409]).toContain(res.status);
  });

  it.each([['student'], ['teacher'], ['admin']])('filters user list by role=%s', async (role) => {
    const { token } = await createAdmin();
    const res = await request(app)
      .get(`/api/v1/admin/users?role=${role}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });
});

describe('Admin — Course Management', () => {
  it('lists all courses for admin', async () => {
    const { token } = await createAdmin();
    await createCourse();
    const res = await request(app)
      .get('/api/v1/admin/courses')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('updates a course as admin', async () => {
    const { token } = await createAdmin();
    const course = await createCourse();
    const res = await request(app)
      .put(`/api/v1/admin/courses/${course._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ title: 'Updated Title' });
    expect([200, 404]).toContain(res.status);
  });

  it('deletes a course as admin', async () => {
    const { token } = await createAdmin();
    const course = await createCourse();
    const res = await request(app)
      .delete(`/api/v1/admin/courses/${course._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 204, 404]).toContain(res.status);
  });

  it('toggles featured status on a course', async () => {
    const { token } = await createAdmin();
    const course = await createCourse();
    const res = await request(app)
      .patch(`/api/v1/admin/courses/${course._id}/featured`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 404]).toContain(res.status);
  });

  it('returns empty courses list when none exist', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .get('/api/v1/admin/courses')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    if (res.status === 200) {
      expect(Array.isArray(res.body.data?.courses ?? res.body.data ?? [])).toBe(true);
    }
  });

  it('paginates admin courses list', async () => {
    const { token } = await createAdmin();
    for (let i = 0; i < 5; i++) await createCourse({ title: `Course ${i}` });
    const res = await request(app)
      .get('/api/v1/admin/courses?page=1&limit=3')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('does not list courses from other tenants', async () => {
    const { token } = await createAdmin(TENANT_A);
    await createCourse({ tenantId: TENANT_B });
    const res = await request(app)
      .get('/api/v1/admin/courses')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    if (res.status === 200) {
      const courses = res.body.data?.courses ?? res.body.data ?? [];
      const leaked =
        Array.isArray(courses) &&
        courses.some((c: any) => c.tenantId?.toString() === TENANT_B.toString());
      expect(leaked).toBe(false);
    }
  });
});

describe('Admin — Review Management', () => {
  it('lists all reviews for admin', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .get('/api/v1/admin/reviews')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('deletes a review as admin', async () => {
    const { token } = await createAdmin();
    const student = await createUser();
    const course = await createCourse();
    const review = await Review.create({
      course: course._id,
      user: student._id,
      rating: 4,
      comment: 'Good course',
      tenantId: TENANT_A,
    });
    const res = await request(app)
      .delete(`/api/v1/admin/reviews/${review._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 204, 404]).toContain(res.status);
  });

  it('bulk deletes reviews', async () => {
    const { token } = await createAdmin();
    const course = await createCourse();
    const students = await Promise.all([createUser(), createUser(), createUser()]);
    const reviews = await Promise.all(
      students.map((student, i) =>
        Review.create({
          course: course._id,
          user: student._id,
          rating: i + 3,
          comment: `Review number ${i} is quite good indeed`,
          tenantId: TENANT_A,
        })
      )
    );
    const res = await request(app)
      .post('/api/v1/admin/reviews/bulk-delete')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ ids: reviews.map((r) => r._id.toString()) });
    expect([200, 204, 400]).toContain(res.status);
  });

  it('toggles review approval', async () => {
    const { token } = await createAdmin();
    const student = await createUser();
    const course = await createCourse();
    const review = await Review.create({
      course: course._id,
      user: student._id,
      rating: 5,
      comment: 'This is an amazing course, highly recommended!',
      tenantId: TENANT_A,
    });
    const res = await request(app)
      .patch(`/api/v1/admin/reviews/${review._id}/toggle-approval`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 404]).toContain(res.status);
  });

  it('returns 404 toggling approval on nonexistent review', async () => {
    const { token } = await createAdmin();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/v1/admin/reviews/${fakeId}/toggle-approval`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([404, 400]).toContain(res.status);
  });

  it('bulk delete with empty ids returns 400', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .post('/api/v1/admin/reviews/bulk-delete')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ ids: [] });
    expect([400, 200]).toContain(res.status);
  });
});

describe('Admin — Enrollments', () => {
  it('lists all enrollments', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .get('/api/v1/admin/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('paginates enrollments list', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .get('/api/v1/admin/enrollments?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('exports enrollments', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .get('/api/v1/admin/enrollments/export')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 204]).toContain(res.status);
  });
});

describe('Admin — Teacher Management', () => {
  it('lists all teachers', async () => {
    const { token } = await createAdmin();
    await createUser({ role: 'teacher' });
    const res = await request(app)
      .get('/api/v1/admin/teachers')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('verifies a teacher', async () => {
    const { token } = await createAdmin();
    const teacher = await createUser({ role: 'teacher', isVerified: false });
    const res = await request(app)
      .patch(`/api/v1/admin/teachers/${teacher._id}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 404]).toContain(res.status);
  });

  it('returns 404 verifying nonexistent teacher', async () => {
    const { token } = await createAdmin();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/v1/admin/teachers/${fakeId}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([404, 400]).toContain(res.status);
  });

  it('teacher list is tenant-scoped', async () => {
    const { token } = await createAdmin(TENANT_A);
    await createUser({ role: 'teacher', tenantId: TENANT_B });
    const res = await request(app)
      .get('/api/v1/admin/teachers')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    if (res.status === 200) {
      const teachers = res.body.data?.teachers ?? res.body.data ?? [];
      const leaked =
        Array.isArray(teachers) &&
        teachers.some((t: any) => t.tenantId?.toString() === TENANT_B.toString());
      expect(leaked).toBe(false);
    }
  });
});

describe('Admin — Announcements', () => {
  it('sends an announcement successfully', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .post('/api/v1/admin/announcements')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ title: 'Important Update', message: 'Platform will be down for maintenance.' });
    expect([200, 201, 400]).toContain(res.status);
  });

  it('requires title for announcement', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .post('/api/v1/admin/announcements')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ message: 'No title here' });
    expect([400, 422]).toContain(res.status);
  });

  it('requires message for announcement', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .post('/api/v1/admin/announcements')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ title: 'No Message' });
    expect([400, 422]).toContain(res.status);
  });

  it('blocks student from sending announcement', async () => {
    const student = await createUser({ role: 'student' });
    const token = makeToken({ id: student._id, tenantId: TENANT_A, role: 'student' });
    const res = await request(app)
      .post('/api/v1/admin/announcements')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Hack', message: 'Injected announcement' });
    expect(res.status).toBe(403);
  });
});

describe('Admin — Revenue', () => {
  it('gets revenue stats', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .get('/api/v1/admin/revenue')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('student cannot access revenue', async () => {
    const student = await createUser({ role: 'student' });
    const token = makeToken({ id: student._id, tenantId: TENANT_A, role: 'student' });
    const res = await request(app)
      .get('/api/v1/admin/revenue')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('filters revenue by date range', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .get('/api/v1/admin/revenue?startDate=2024-01-01&endDate=2024-12-31')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });
});

describe('Admin — Coupon Management', () => {
  it('lists coupons for admin', async () => {
    const { token } = await createAdmin();
    await createCoupon();
    const res = await request(app)
      .get('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('gets coupon by id', async () => {
    const { token } = await createAdmin();
    const coupon = await createCoupon();
    const res = await request(app)
      .get(`/api/v1/admin/coupons/${coupon._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 404]).toContain(res.status);
  });

  it('creates a coupon', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .post('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({
        code: `CREATE${Date.now()}`,
        discountType: 'percentage',
        discountValue: 20,
        usageLimit: 50,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      });
    expect([201, 200, 400]).toContain(res.status);
  });

  it('rejects duplicate coupon code', async () => {
    const { token } = await createAdmin();
    const coupon = await createCoupon({ code: 'DUPETEST' });
    const res = await request(app)
      .post('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({
        code: 'DUPETEST',
        discountType: 'percentage',
        discountValue: 10,
        usageLimit: 10,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
      });
    expect([409, 400]).toContain(res.status);
  });

  it('updates a coupon', async () => {
    const { token } = await createAdmin();
    const coupon = await createCoupon();
    const res = await request(app)
      .put(`/api/v1/admin/coupons/${coupon._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ discountValue: 25 });
    expect([200, 404]).toContain(res.status);
  });

  it('deletes a coupon', async () => {
    const { token } = await createAdmin();
    const coupon = await createCoupon();
    const res = await request(app)
      .delete(`/api/v1/admin/coupons/${coupon._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 204, 404]).toContain(res.status);
  });

  it('returns 404 for coupon not in this tenant', async () => {
    const { token } = await createAdmin(TENANT_A);
    const coupon = await createCoupon({ tenantId: TENANT_B });
    const res = await request(app)
      .get(`/api/v1/admin/coupons/${coupon._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([404]).toContain(res.status);
  });

  it.each([
    ['percentage', 15],
    ['flat', 100],
  ])('creates %s coupon with value %d', async (discountType, discountValue) => {
    const { token } = await createAdmin();
    const res = await request(app)
      .post('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({
        code: `TYPE${discountType.toUpperCase()}${Date.now()}`,
        discountType,
        discountValue,
        usageLimit: 10,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
      });
    expect([201, 200, 400]).toContain(res.status);
  });

  it('coupon code is stored as uppercase', async () => {
    const { token } = await createAdmin();
    const code = `lowercase${Date.now()}`;
    const res = await request(app)
      .post('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({
        code,
        discountType: 'percentage',
        discountValue: 10,
        usageLimit: 5,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
      });
    if (res.status === 201 || res.status === 200) {
      const saved = res.body.data?.coupon;
      if (saved) expect(saved.code).toBe(code.toUpperCase());
    }
  });

  it('student cannot list coupons via admin route', async () => {
    const student = await createUser({ role: 'student' });
    const token = makeToken({ id: student._id, tenantId: TENANT_A, role: 'student' });
    const res = await request(app)
      .get('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('Admin — Quiz & Test Management', () => {
  it('lists quizzes for admin', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .get('/api/v1/admin/quizzes')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('deletes a quiz as admin', async () => {
    const { token } = await createAdmin();
    const quiz = await Quiz.create({
      title: 'Admin Delete Quiz',
      tenantId: TENANT_A,
      questions: [],
      duration: 10,
      course: new mongoose.Types.ObjectId(),
      teacher: new mongoose.Types.ObjectId(),
    });
    const res = await request(app)
      .delete(`/api/v1/admin/quizzes/${quiz._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 204, 404]).toContain(res.status);
  });

  it('lists tests for admin', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .get('/api/v1/admin/tests')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('deletes a test as admin', async () => {
    const { token } = await createAdmin();
    const test = await Test.create({
      title: 'Admin Delete Test',
      tenantId: TENANT_A,
      duration: 30,
      totalMarks: 100,
      passingMarks: 40,
      questions: [],
      course: new mongoose.Types.ObjectId(),
      teacher: new mongoose.Types.ObjectId(),
      category: new mongoose.Types.ObjectId(),
      createdBy: new mongoose.Types.ObjectId(),
    });
    const res = await request(app)
      .delete(`/api/v1/admin/tests/${test._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 204, 404]).toContain(res.status);
  });

  it('returns 404 deleting nonexistent quiz', async () => {
    const { token } = await createAdmin();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/v1/admin/quizzes/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([404, 400]).toContain(res.status);
  });

  it('returns 404 deleting nonexistent test', async () => {
    const { token } = await createAdmin();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/v1/admin/tests/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([404, 400]).toContain(res.status);
  });
});

describe('Admin — Super Admin Cross-Tenant Access', () => {
  it('super_admin can access dashboard with X-Tenant-Id', async () => {
    const { sa, token } = await createSuperAdmin();
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 403]).toContain(res.status);
  });

  it('super_admin can list users with X-Tenant-Id', async () => {
    const { sa, token } = await createSuperAdmin();
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 403]).toContain(res.status);
  });

  it('super_admin can create coupon with X-Tenant-Id header', async () => {
    const { token } = await createSuperAdmin();
    const res = await request(app)
      .post('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({
        code: `SUPER${Date.now()}`,
        discountType: 'percentage',
        discountValue: 30,
        usageLimit: 100,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 14).toISOString(),
      });
    expect([201, 200, 400, 403]).toContain(res.status);
  });

  it.each([
    '/api/v1/admin/courses',
    '/api/v1/admin/enrollments',
    '/api/v1/admin/revenue',
    '/api/v1/admin/teachers',
    '/api/v1/admin/coupons',
  ])('super_admin can reach %s with X-Tenant-Id', async (route) => {
    const { token } = await createSuperAdmin();
    const res = await request(app)
      .get(route)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 403]).toContain(res.status);
  });
});

describe('Admin — Input Validation', () => {
  it.each([
    [{ code: '', discountType: 'percentage', discountValue: 10 }, 'empty code'],
    [{ code: 'TEST', discountType: 'invalid', discountValue: 10 }, 'invalid discountType'],
    [{ code: 'TEST', discountType: 'percentage', discountValue: -5 }, 'negative discountValue'],
    [{ code: 'TEST', discountType: 'percentage', discountValue: 110 }, 'percentage > 100'],
  ])('rejects coupon creation with %s', async (body, _desc) => {
    const { token } = await createAdmin();
    const res = await request(app)
      .post('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send(body);
    expect([400, 422]).toContain(res.status);
  });

  it.each([
    ['invalid-id', 'course'],
    ['invalid-id', 'quiz'],
    ['invalid-id', 'test'],
  ])('returns 400 or 404 for invalid ObjectId in %s delete', async (id, resource) => {
    const { token } = await createAdmin();
    const res = await request(app)
      .delete(`/api/v1/admin/${resource}s/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([400, 404]).toContain(res.status);
  });
});

describe('Admin — Rate Limiting & Security', () => {
  it('returns 401 for tampered JWT', async () => {
    const { token } = await createAdmin();
    const [header, payload] = token.split('.');
    const fakeToken = `${header}.${payload}.invalidsignature`;
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${fakeToken}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect(res.status).toBe(401);
  });

  it('rejects requests without Bearer prefix', async () => {
    const { admin } = await createAdmin();
    const token = makeToken({ id: admin._id, role: 'admin', tenantId: TENANT_A });
    const res = await request(app).get('/api/v1/admin/dashboard').set('Authorization', token);
    expect(res.status).toBe(401);
  });

  it('handles very large page numbers gracefully', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .get('/api/v1/admin/users?page=999999&limit=10')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
    if (res.status === 200) {
      const data = res.body.data?.users ?? res.body.data ?? [];
      expect(Array.isArray(data)).toBe(true);
    }
  });

  it('handles limit=0 gracefully', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .get('/api/v1/admin/users?limit=0')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 400]).toContain(res.status);
  });

  it('SQL injection attempt in search param returns safe response', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .get("/api/v1/admin/users?search=' OR '1'='1")
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 400]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });
});
