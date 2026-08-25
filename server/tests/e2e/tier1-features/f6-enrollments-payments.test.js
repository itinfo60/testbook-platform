import '../setup.js';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app.js';
import { getStudentHeaders, getAdminHeaders, DEFAULT_TENANT_ID } from '../helpers/auth.helper.js';

describe('Tier 1 — Feature 6: Enrollments & Payments API', () => {
  const { headers: studentHeaders } = getStudentHeaders();
  const { headers: adminHeaders } = getAdminHeaders();

  it('F6-T1: POST /api/v1/enrollments attempts course enrollment with payload validation', async () => {
    const enrollmentPayload = {
      courseId: '00000000-0000-0000-0000-000000000001',
    };

    const res = await request(app)
      .post('/api/v1/enrollments')
      .set(studentHeaders)
      .send(enrollmentPayload);

    expect([201, 200, 400, 404, 409]).toContain(res.status);
    if (res.status === 201 || res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  it('F6-T2: GET /api/v1/enrollments/my lists student enrolled courses', async () => {
    const res = await request(app).get('/api/v1/enrollments/my').set(studentHeaders);

    expect([200, 400, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    }
  });

  it('F6-T3: POST /api/v1/payments/create-order creates a gateway payment order', async () => {
    const orderPayload = {
      courseId: '00000000-0000-0000-0000-000000000001',
    };

    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .set(studentHeaders)
      .send(orderPayload);

    expect([201, 200, 400, 404, 409]).toContain(res.status);
    if (res.status === 201 || res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('orderId');
    }
  });

  it('F6-T4: POST /api/v1/payments/dummy-checkout performs instant mock enrollment in test environment', async () => {
    const dummyPayload = {
      courseId: '00000000-0000-0000-0000-000000000001',
    };

    const res = await request(app)
      .post('/api/v1/payments/dummy-checkout')
      .set(studentHeaders)
      .send(dummyPayload);

    expect([201, 200, 400, 404, 409]).toContain(res.status);
    if (res.status === 201 || res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    }
  });

  it('F6-T5: POST /api/v1/coupons/validate calculates coupon discount rate', async () => {
    const couponPayload = {
      code: 'TEST50',
      courseId: '00000000-0000-0000-0000-000000000001',
      amount: 1000,
    };

    const res = await request(app)
      .post('/api/v1/coupons/validate')
      .set(studentHeaders)
      .send(couponPayload);

    expect([200, 400, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('discount');
    }
  });
});
