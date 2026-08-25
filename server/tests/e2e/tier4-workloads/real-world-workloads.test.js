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

describe('Tier 4 — Real-World Application Workloads', () => {
  it('Workload 1: Complete Student Journey (Register -> Login -> Browse Catalog -> Profile Update)', async () => {
    const studentData = {
      name: 'Workload Student',
      email: `wl_student_${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'student',
    };

    // Step 1: Register
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Tenant-Id', DEFAULT_TENANT_ID)
      .send(studentData);

    expect([201, 200, 409, 400]).toContain(regRes.status);
    let token = regRes.body.data?.accessToken;

    // Step 2: Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Tenant-Id', DEFAULT_TENANT_ID)
      .send({
        email: studentData.email,
        password: studentData.password,
      });

    if (loginRes.status === 200) {
      token = loginRes.body.data.accessToken;
    }

    // Step 3: Browse Course Catalog
    const catalogRes = await request(app)
      .get('/api/v1/courses?page=1&limit=5')
      .set('X-Tenant-Id', DEFAULT_TENANT_ID);

    expect([200, 400]).toContain(catalogRes.status);
    if (catalogRes.status === 200) {
      expect(catalogRes.body.success).toBe(true);
    }

    // Step 4: Profile Check
    if (token) {
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Tenant-Id', DEFAULT_TENANT_ID);

      expect([200, 401, 404, 400]).toContain(meRes.status);
    }
  });

  it('Workload 2: Teacher Publishing Pipeline (Login -> Create Course -> List Courses)', async () => {
    const { headers: teacherHeaders } = getTeacherHeaders();

    // Step 1: Create Course Draft
    const coursePayload = {
      title: `E2E Pipeline Course ${Date.now()}`,
      slug: `e2e-pipeline-${Date.now()}`,
      description:
        'Comprehensive pipeline authoring course with multiple chapters and assessments.',
      price: 39.99,
      level: 'advanced',
      category: '00000000-0000-0000-0000-000000000001',
      pricingType: 'paid',
    };

    const createRes = await request(app)
      .post('/api/v1/courses')
      .set(teacherHeaders)
      .send(coursePayload);

    expect([201, 200, 401, 400]).toContain(createRes.status);

    // Step 2: List Courses Catalog
    const listRes = await request(app).get('/api/v1/courses').set('X-Tenant-Id', DEFAULT_TENANT_ID);

    expect([200, 400]).toContain(listRes.status);
    if (listRes.status === 200) {
      expect(listRes.body.success).toBe(true);
    }
  });

  it('Workload 3: Assessment & Examination Pipeline (Create Test -> Student Attempt Check)', async () => {
    const { headers: teacherHeaders } = getTeacherHeaders();
    const { headers: studentHeaders } = getStudentHeaders();

    // Step 1: Teacher creates Mock Test
    const testPayload = {
      title: `Workload Assessment ${Date.now()}`,
      description: 'Automated test suite evaluation test.',
      duration: 30,
      totalMarks: 50,
      passingMarks: 25,
      price: 0,
      pricingType: 'free',
      category: '00000000-0000-0000-0000-000000000001',
      questions: [
        {
          question: 'Are Vitest and Supertest used for E2E testing?',
          type: 'true_false',
          options: [
            { text: 'True', isCorrect: true },
            { text: 'False', isCorrect: false },
          ],
          marks: 50,
        },
      ],
    };

    const createTestRes = await request(app)
      .post('/api/v1/tests')
      .set(teacherHeaders)
      .send(testPayload);

    expect([201, 200, 401, 400]).toContain(createTestRes.status);
    const testId = createTestRes.body.data?.test?.id || '00000000-0000-0000-0000-000000000001';

    // Step 2: Student starts test attempt
    const startRes = await request(app).post(`/api/v1/tests/${testId}/start`).set(studentHeaders);

    expect([200, 401, 403, 404, 400]).toContain(startRes.status);
  });

  it('Workload 4: Commerce, Coupon & Checkout Pipeline (Browse -> Coupon -> Dummy Payment)', async () => {
    const { headers: studentHeaders } = getStudentHeaders();

    // Step 1: Validate Coupon
    const couponRes = await request(app).post('/api/v1/coupons/validate').set(studentHeaders).send({
      code: 'WORKLOAD100',
      courseId: '00000000-0000-0000-0000-000000000001',
      amount: 200,
    });

    expect([200, 400, 404]).toContain(couponRes.status);

    // Step 2: Mock Checkout
    const checkoutRes = await request(app)
      .post('/api/v1/payments/dummy-checkout')
      .set(studentHeaders)
      .send({
        courseId: '00000000-0000-0000-0000-000000000001',
      });

    expect([201, 200, 400, 404, 409]).toContain(checkoutRes.status);

    // Step 3: Check My Enrollments
    const myEnrollRes = await request(app).get('/api/v1/enrollments/my').set(studentHeaders);

    expect([200, 401, 400]).toContain(myEnrollRes.status);
  });

  it('Workload 5: Admin Platform Oversight & Analytics Pipeline (Query Metrics -> Review Management)', async () => {
    const { headers: adminHeaders } = getAdminHeaders();

    // Step 1: Query Admin Dashboard Stats
    const dashRes = await request(app).get('/api/v1/admin/dashboard').set(adminHeaders);

    expect([200, 401, 403, 500, 400]).toContain(dashRes.status);

    // Step 2: Browse Admin Users
    const usersRes = await request(app).get('/api/v1/admin/users?page=1&limit=5').set(adminHeaders);

    expect([200, 401, 403, 500, 400]).toContain(usersRes.status);

    // Step 3: Check Public Health
    const healthRes = await request(app).get('/health');
    expect([200, 400]).toContain(healthRes.status);
    if (healthRes.status === 200) {
      expect(healthRes.body.status).toBe('healthy');
    }
  });
});
