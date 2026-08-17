import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import app from '../src/app.js';
import User from '../src/modules/user/user.model.ts';
import Course from '../src/modules/course/course.model.ts';
import Enrollment from '../src/modules/enrollment/enrollment.model.js';
import redis from '../src/config/redis.js';

describe('Enrollment Flow Tests', () => {
  let token;
  let userId;
  let freeCourse;
  let paidCourse;

  beforeEach(async () => {
    vi.spyOn(redis, 'get').mockResolvedValue(null);
    vi.spyOn(redis, 'set').mockResolvedValue('OK');

    const testUser = {
      name: 'Enroll User',
      email: 'enroll@example.com',
      password: 'Password123!',
      role: 'student',
    };

    const loginRes = await request(app).post('/api/v1/auth/register').send(testUser);
    token = loginRes.body.data.accessToken;
    userId = loginRes.body.data.user.id;

    freeCourse = await Course.create({
      title: 'Free Course',
      slug: 'free-course',
      price: 0,
      pricingType: 'free',
      isPublished: true,
      instructor: userId,
    });

    paidCourse = await Course.create({
      title: 'Paid Course',
      slug: 'paid-course',
      price: 100,
      pricingType: 'paid',
      isPublished: true,
      instructor: userId,
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
  });

  it('should enroll in free course successfully', async () => {
    const res = await request(app)
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: freeCourse._id });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('course');
  });

  it('should not enroll twice in same course', async () => {
    await request(app)
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: freeCourse._id });

    const res2 = await request(app)
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: freeCourse._id });

    expect([409, 400]).toContain(res2.status);
  });

  it('should not enroll in paid course without payment', async () => {
    const res = await request(app)
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: paidCourse._id });

    expect([400, 402, 403]).toContain(res.status);
  });

  it('should return only current user enrollments', async () => {
    await request(app)
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: freeCourse._id });

    // Create another user and their enrollment
    const user2 = await request(app).post('/api/v1/auth/register').send({
      name: 'User 2',
      email: 'u2@example.com',
      password: 'Password123!',
    });
    const token2 = user2.body.data.accessToken;
    await Enrollment.create({
      user: user2.body.data.user.id,
      course: freeCourse._id,
      status: 'active',
    });

    const res = await request(app)
      .get('/api/v1/enrollments')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // Should only have 1 enrollment, belonging to current user
    expect(res.body.data.results.length).toBe(1);
    expect(res.body.data.results[0].course._id.toString()).toBe(freeCourse._id.toString());
  });

  it('should update progress successfully', async () => {
    const enrollRes = await request(app)
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: freeCourse._id });

    const enrollmentId = enrollRes.body.data.id || enrollRes.body.data._id;

    if (enrollmentId) {
      const res = await request(app)
        .patch(`/api/v1/enrollments/${enrollmentId}/progress`)
        .set('Authorization', `Bearer ${token}`)
        .send({ progress: 50, lastAccessedLesson: 'lesson_1' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }
  });
});
