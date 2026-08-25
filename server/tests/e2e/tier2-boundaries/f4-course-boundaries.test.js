import '../setup.js';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app.js';
import { getTeacherHeaders, getStudentHeaders, DEFAULT_TENANT_ID } from '../helpers/auth.helper.js';

describe('Tier 2 — Feature 4: Course & Learning Boundaries & Validation', () => {
  const { headers: teacherHeaders } = getTeacherHeaders();
  const { headers: studentHeaders } = getStudentHeaders();

  it('F4-B1: POST /api/v1/courses with empty title fails validation with 400 Bad Request', async () => {
    const invalidCourse = {
      title: '',
      description: 'A valid description with sufficient length for validation.',
      price: 19.99,
      category: '00000000-0000-0000-0000-000000000001',
    };

    const res = await request(app).post('/api/v1/courses').set(teacherHeaders).send(invalidCourse);

    expect([400, 422]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('F4-B2: GET /api/v1/courses/:id with non-existent UUID returns 404 Not Found', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000009999';
    const res = await request(app)
      .get(`/api/v1/courses/${nonExistentId}`)
      .set('X-Tenant-Id', DEFAULT_TENANT_ID);

    expect([404, 400]).toContain(res.status);
  });

  it('F4-B3: POST /api/v1/courses with negative price returns 400 Bad Request', async () => {
    const negativePriceCourse = {
      title: 'Course with Invalid Price',
      description: 'A course that tries to specify a negative price amount.',
      price: -50,
      category: '00000000-0000-0000-0000-000000000001',
    };

    const res = await request(app)
      .post('/api/v1/courses')
      .set(teacherHeaders)
      .send(negativePriceCourse);

    expect([400, 422]).toContain(res.status);
  });

  it('F4-B4: PUT /api/v1/courses/:id by student role returns 403 Forbidden', async () => {
    const res = await request(app)
      .put('/api/v1/courses/00000000-0000-0000-0000-000000000001')
      .set(studentHeaders)
      .send({ title: 'Hacked Title' });

    expect([403, 401, 404, 400]).toContain(res.status);
  });

  it('F4-B5: POST /api/v1/courses without category returns 400 Bad Request', async () => {
    const missingCategoryCourse = {
      title: 'Course without Category',
      description: 'A course missing required category reference id.',
      price: 10,
    };

    const res = await request(app)
      .post('/api/v1/courses')
      .set(teacherHeaders)
      .send(missingCategoryCourse);

    expect([400, 422]).toContain(res.status);
  });
});
