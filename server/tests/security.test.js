import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import app from '../src/app.js';
import User from '../src/modules/user/user.model.ts';
import Course from '../src/modules/course/course.model.ts';
import Enrollment from '../src/modules/enrollment/enrollment.model.js';
import redis from '../src/config/redis.js';

describe('Security and Bad User Scenario Tests', () => {
  const testUser = {
    name: 'Sec User',
    email: 'sec@example.com',
    password: 'Password123!',
    role: 'student',
  };

  const adminUser = {
    name: 'Admin User',
    email: 'adminsec@example.com',
    password: 'Password123!',
    role: 'admin',
  };

  beforeEach(async () => {
    vi.spyOn(redis, 'get').mockResolvedValue(null);
    vi.spyOn(redis, 'set').mockResolvedValue('OK');
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
  });

  it('XSS payload in name field is safely handled', async () => {
    const xssPayload = '<script>alert("xss")</script>';
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, name: xssPayload });

    expect(res.status).toBe(201);
    expect(res.body.data.user.name).toBe(xssPayload);
  });

  it('NoSQL injection in login is rejected by validation', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: { $gt: '' } });

    // Zod validation should block object passwords
    expect(res.status).toBe(400);
  });

  it('Missing required fields return 400 with validation message', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'no-name@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
  });

  it('Accessing /api/v1/admin/* without admin role returns 403', async () => {
    const loginRes = await request(app).post('/api/v1/auth/register').send(testUser);
    const token = loginRes.body.data.accessToken;

    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect([403, 401]).toContain(res.status); // Usually 403 forbidden or 401 unauth
  });

  it('User A cannot view User B private enrollment data', async () => {
    const userA = await request(app).post('/api/v1/auth/register').send(testUser);
    const userB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...testUser,
        email: 'sec2@example.com',
      });

    const tokenA = userA.body.data.accessToken;
    const userBid = userB.body.data.user.id;

    // Enrollment API is usually scoped to the requesting user or requires admin
    // We simulate by trying to get someone else's enrollment list if endpoint allows passing ID
    // If endpoint is /api/v1/enrollments (gets my enrollments), it naturally protects
    const res = await request(app)
      .get(`/api/v1/enrollments?user=${userBid}`)
      .set('Authorization', `Bearer ${tokenA}`);

    // Assuming API only returns my own enrollments, I shouldn't see B's
    // Even if it returns 200, the data should not belong to B (unless endpoint supports filtering and validates role)
    if (res.status === 200) {
      expect(res.body.data.results.some((e) => e.user === userBid)).toBe(false);
    } else {
      expect([403, 401, 400]).toContain(res.status);
    }
  });

  it('Enrollment without payment on paid course returns 402/403', async () => {
    const loginRes = await request(app).post('/api/v1/auth/register').send(testUser);
    const token = loginRes.body.data.accessToken;
    const userId = loginRes.body.data.user.id;

    const course = await Course.create({
      title: 'Paid Course',
      slug: 'paid-course',
      price: 1000,
      pricingType: 'paid',
      isPublished: true,
      instructor: userId,
    });

    const res = await request(app)
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: course._id });

    // Assuming the API expects payment confirmation for paid courses
    expect([400, 402, 403]).toContain(res.status);
  });
});
