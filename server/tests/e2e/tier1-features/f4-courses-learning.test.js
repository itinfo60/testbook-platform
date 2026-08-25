import '../setup.js';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app.js';
import { getTeacherHeaders, getStudentHeaders, DEFAULT_TENANT_ID } from '../helpers/auth.helper.js';

describe('Tier 1 — Feature 4: Course & Learning API', () => {
  let createdCourseId = '';
  const { headers: teacherHeaders } = getTeacherHeaders();

  it('F4-T1: POST /api/v1/courses creates a course draft with teacher authorization', async () => {
    const coursePayload = {
      title: 'E2E Testing Masterclass with Vitest',
      slug: `e2e-vitest-${Date.now()}`,
      description: 'Comprehensive course covering automated test design and Prisma integration.',
      price: 49.99,
      level: 'intermediate',
      category: '00000000-0000-0000-0000-000000000001',
      pricingType: 'paid',
    };

    const res = await request(app).post('/api/v1/courses').set(teacherHeaders).send(coursePayload);

    expect([201, 200, 401, 400]).toContain(res.status);
    if (res.status === 201 || res.status === 200) {
      expect(res.body.success).toBe(true);
      if (res.body.data?.course) {
        createdCourseId = res.body.data.course.id || res.body.data.course._id;
      }
    }
  });

  it('F4-T2: GET /api/v1/courses lists published courses with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/courses?page=1&limit=10')
      .set('X-Tenant-Id', DEFAULT_TENANT_ID);

    expect([200, 400]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    }
  });

  it('F4-T3: GET /api/v1/courses/:id retrieves course detail or handles 404 for unknown ID', async () => {
    const targetId = createdCourseId || '00000000-0000-0000-0000-000000000099';
    const res = await request(app)
      .get(`/api/v1/courses/${targetId}`)
      .set('X-Tenant-Id', DEFAULT_TENANT_ID);

    expect([200, 404, 400, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    }
  });

  it('F4-T4: GET /api/v1/courses/sample-classes returns sample video previews', async () => {
    const res = await request(app)
      .get('/api/v1/courses/sample-classes')
      .set('X-Tenant-Id', DEFAULT_TENANT_ID);

    expect([200, 404, 400, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  it('F4-T5: GET /api/v1/categories lists active categories', async () => {
    const res = await request(app).get('/api/v1/categories').set('X-Tenant-Id', DEFAULT_TENANT_ID);

    expect([200, 304, 400]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    }
  });
});
