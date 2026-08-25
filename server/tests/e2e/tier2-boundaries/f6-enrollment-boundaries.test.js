import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app.js';
import { getStudentHeaders, DEFAULT_TENANT_ID } from '../helpers/auth.helper.js';
import '../setup.js';

describe('Tier 2 — Feature 6: Commerce, Payment & Coupon Boundaries', () => {
  const { headers: studentHeaders } = getStudentHeaders();

  it('F6-B1: Payment creation with empty payload returns 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .set(studentHeaders)
      .send({});

    expect([400, 422]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('F6-B2: Payment verification with invalid signature returns 400 or 401', async () => {
    const invalidVerification = {
      razorpay_order_id: 'order_invalid_123',
      razorpay_payment_id: 'pay_invalid_123',
      razorpay_signature: 'forged_fake_signature_hash',
    };

    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set(studentHeaders)
      .send(invalidVerification);

    expect([400, 401, 404]).toContain(res.status);
  });

  it('F6-B3: Applying coupon with invalid code returns 400 or 404 Not Found', async () => {
    const invalidCoupon = {
      code: 'EXPIRED_OR_NONEXISTENT_COUPON_XYZ',
      courseId: '00000000-0000-0000-0000-000000000001',
      amount: 500,
    };

    const res = await request(app)
      .post('/api/v1/coupons/validate')
      .set(studentHeaders)
      .send(invalidCoupon);

    expect([400, 404]).toContain(res.status);
  });

  it('F6-B4: Enrollment progress check for non-existent course returns 404 Not Found', async () => {
    const nonExistentCourseId = '00000000-0000-0000-0000-000000006666';
    const res = await request(app)
      .get(`/api/v1/enrollments/progress/${nonExistentCourseId}`)
      .set(studentHeaders);

    expect([404, 400]).toContain(res.status);
  });

  it('F6-B5: Certificate generation for incomplete course returns 404 or 400', async () => {
    const courseId = '00000000-0000-0000-0000-000000000001';
    const res = await request(app)
      .get(`/api/v1/enrollments/certificate/${courseId}`)
      .set(studentHeaders);

    expect([400, 404]).toContain(res.status);
  });
});
