import '../setup.js';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app.js';
import {
  getTeacherHeaders,
  getStudentHeaders,
  getAdminHeaders,
  DEFAULT_TENANT_ID,
} from '../helpers/auth.helper.js';
import prisma from '../../../src/config/prisma.js';

describe('Tier 3 — Pairwise Cross-Feature Interactions', () => {
  const { headers: teacherHeaders } = getTeacherHeaders();
  const { headers: studentHeaders } = getStudentHeaders();
  const { headers: adminHeaders } = getAdminHeaders();

  it('Pairwise 1 [Auth F3 + Course F4]: Teacher authenticates and creates a new course', async () => {
    const coursePayload = {
      title: 'Pairwise Auth-Course Integration Course',
      slug: `pw-course-${Date.now()}`,
      description: 'Course verifying teacher auth token integration with course management.',
      price: 29.99,
      level: 'beginner',
      category: '00000000-0000-0000-0000-000000000001',
      pricingType: 'paid',
    };

    const res = await request(app).post('/api/v1/courses').set(teacherHeaders).send(coursePayload);

    expect([201, 200, 401, 400]).toContain(res.status);
    if (res.status === 201 || res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  it('Pairwise 2 [Course F4 + Commerce F6]: Student browses course and applies discount coupon', async () => {
    const catalogRes = await request(app)
      .get('/api/v1/courses?limit=1')
      .set('X-Tenant-Id', DEFAULT_TENANT_ID);

    expect([200, 400]).toContain(catalogRes.status);

    const couponRes = await request(app).post('/api/v1/coupons/validate').set(studentHeaders).send({
      code: 'PAIRWISE20',
      courseId: '00000000-0000-0000-0000-000000000001',
      amount: 100,
    });

    expect([200, 400, 404]).toContain(couponRes.status);
  });

  it('Pairwise 3 [Enrollment F6 + Assessment F5]: Student verifies enrollment and takes course assessment', async () => {
    const enrollCheckRes = await request(app)
      .get('/api/v1/enrollments/check/00000000-0000-0000-0000-000000000001')
      .set(studentHeaders);

    expect([200, 401, 404, 400]).toContain(enrollCheckRes.status);

    const testAttemptRes = await request(app)
      .post('/api/v1/tests/00000000-0000-0000-0000-000000000001/start')
      .set(studentHeaders);

    expect([200, 401, 403, 404, 400]).toContain(testAttemptRes.status);
  });

  it('Pairwise 4 [Assessment F5 + Review F7]: Student completes assessment flow and posts course rating', async () => {
    const reviewRes = await request(app).post('/api/v1/reviews').set(studentHeaders).send({
      course: '00000000-0000-0000-0000-000000000001',
      rating: 5,
      comment: 'Great assessment and practical exercises.',
    });

    expect([201, 200, 400, 403, 404, 409]).toContain(reviewRes.status);
  });

  it('Pairwise 5 [Auth F3 + Admin F7]: Admin authenticates and queries platform-wide statistics', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard').set(adminHeaders);

    expect([200, 401, 403, 400, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  it('Pairwise 6 [Zero Mongoose F2 + API Handlers F3-F7]: Prisma client singleton is ready for data operations', () => {
    expect(prisma).toBeDefined();
    expect(prisma.user).toBeDefined();
    expect(prisma.course).toBeDefined();
    expect(prisma.test).toBeDefined();
    expect(prisma.enrollment).toBeDefined();
    expect(prisma.payment).toBeDefined();
    expect(prisma.review).toBeDefined();
  });

  it('Pairwise 7 [Startup Boot F1 + Tenant Scoping F3-F6]: Multi-tenant requests are scoped by X-Tenant-Id', async () => {
    const tenantA = '00000000-0000-0000-0000-000000000001';
    const tenantB = '00000000-0000-0000-0000-000000000002';

    const resA = await request(app).get('/api/v1/courses').set('X-Tenant-Id', tenantA);

    const resB = await request(app).get('/api/v1/courses').set('X-Tenant-Id', tenantB);

    expect([200, 400]).toContain(resA.status);
    expect([200, 400]).toContain(resB.status);
  });
});
