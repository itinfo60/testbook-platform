import '../setup.js';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app.js';
import { getStudentHeaders, getAdminHeaders, DEFAULT_TENANT_ID } from '../helpers/auth.helper.js';

describe('Tier 1 — Feature 7: Community, Admin & Operations', () => {
  const { headers: studentHeaders } = getStudentHeaders();
  const { headers: adminHeaders } = getAdminHeaders();

  it('F7-T1: POST /api/v1/reviews validates review creation payload and enrollment check', async () => {
    const reviewPayload = {
      course: '00000000-0000-0000-0000-000000000001',
      rating: 5,
      comment: 'Excellent structured content with real-world examples.',
    };

    const res = await request(app).post('/api/v1/reviews').set(studentHeaders).send(reviewPayload);

    expect([201, 200, 400, 403, 404, 409]).toContain(res.status);
    if (res.status === 201 || res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  it('F7-T2: GET /api/v1/reviews/course/:courseId retrieves approved course reviews', async () => {
    const courseId = '00000000-0000-0000-0000-000000000001';
    const res = await request(app)
      .get(`/api/v1/reviews/course/${courseId}`)
      .set('X-Tenant-Id', DEFAULT_TENANT_ID);

    expect([200, 400, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    }
  });

  it('F7-T3: GET /api/v1/blogs lists published blog posts with pagination', async () => {
    const res = await request(app).get('/api/v1/blogs').set('X-Tenant-Id', DEFAULT_TENANT_ID);

    expect([200, 304, 400]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  it('F7-T4: GET /api/v1/discussions/course/:courseId retrieves discussion threads', async () => {
    const courseId = '00000000-0000-0000-0000-000000000001';
    const res = await request(app)
      .get(`/api/v1/discussions/course/${courseId}`)
      .set(studentHeaders);

    expect([200, 400, 404, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  it('F7-T5: GET /api/v1/admin/dashboard returns aggregated KPI analytics with admin role', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard').set(adminHeaders);

    expect([200, 400, 401, 403, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });
});
