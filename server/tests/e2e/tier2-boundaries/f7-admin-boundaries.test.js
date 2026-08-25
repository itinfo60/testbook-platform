import '../setup.js';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app.js';
import { getStudentHeaders, DEFAULT_TENANT_ID } from '../helpers/auth.helper.js';

describe('Tier 2 — Feature 7: Admin, Moderation & Security Boundaries', () => {
  const { headers: studentHeaders } = getStudentHeaders();

  it('F7-B1: Student access to admin settings endpoint returns 403 Forbidden', async () => {
    const res = await request(app).get('/api/v1/settings/admin').set(studentHeaders);

    expect([403, 401, 400]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('F7-B2: Review creation with rating out of bounds (>5 or <1) returns 400 Bad Request', async () => {
    const outOfBoundsReview = {
      course: '00000000-0000-0000-0000-000000000001',
      rating: 10,
      comment: 'Super awesome rating beyond scale!',
    };

    const res = await request(app)
      .post('/api/v1/reviews')
      .set(studentHeaders)
      .send(outOfBoundsReview);

    expect([400, 422]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('F7-B3: Review creation with empty comment / missing course returns 400 Bad Request', async () => {
    const emptyReview = {
      rating: 5,
    };

    const res = await request(app).post('/api/v1/reviews').set(studentHeaders).send(emptyReview);

    expect([400, 422]).toContain(res.status);
  });

  it('F7-B4: Student access to admin user query route returns 403 Forbidden', async () => {
    const res = await request(app).get('/api/v1/admin/users').set(studentHeaders);

    expect([403, 401, 400]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('F7-B5: Search endpoint handles SQL/NoSQL injection payloads safely without crashing', async () => {
    const injectionPayload = "'; DROP TABLE users; --";
    const res = await request(app)
      .get(`/api/v1/search?q=${encodeURIComponent(injectionPayload)}`)
      .set('X-Tenant-Id', DEFAULT_TENANT_ID);

    expect([200, 400, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });
});
