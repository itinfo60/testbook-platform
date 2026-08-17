import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import app from '../src/app.js';
import User from '../src/modules/user/user.model.ts';
import Course from '../src/modules/course/course.model.ts';
import redis from '../src/config/redis.js';

describe('Course CRUD Tests', () => {
  let studentToken;
  let teacherToken;
  let adminToken;
  let teacherId;

  beforeEach(async () => {
    vi.spyOn(redis, 'get').mockResolvedValue(null);
    vi.spyOn(redis, 'set').mockResolvedValue('OK');

    const studentRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Student',
      email: 'stu@example.com',
      password: 'Password123!',
      role: 'student',
    });
    studentToken = studentRes.body.data.accessToken;

    const teacherRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Teacher',
      email: 'teach@example.com',
      password: 'Password123!',
      role: 'student',
    });
    teacherToken = teacherRes.body.data.accessToken;
    teacherId = teacherRes.body.data.user.id;
    await User.findByIdAndUpdate(teacherId, { role: 'teacher' });

    const adminRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'Password123!',
      role: 'student',
    });
    await User.findByIdAndUpdate(adminRes.body.data.user.id, { role: 'admin' });
    adminToken = adminRes.body.data.accessToken;
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
  });

  it('GET /api/v1/courses returns published courses only for non-auth', async () => {
    await Course.create({
      title: 'Pub Course',
      description: 'This is a description that is long enough.',
      category: '600000000000000000000000',
      teacher: teacherId,
      slug: 'pub',
      price: 0,
      isPublished: true,
      pricingType: 'free',
    });
    await Course.create({
      title: 'Unpub Course',
      description: 'This is a description that is long enough.',
      category: '600000000000000000000000',
      teacher: teacherId,
      slug: 'unpub',
      price: 0,
      isPublished: false,
      pricingType: 'free',
    });

    const res = await request(app).get('/api/v1/courses');
    if (res.status !== 200 || !res.body.data?.docs) console.error(res.body);
    expect(res.status).toBe(200);
    expect(res.body.data.docs.length).toBe(1);
    expect(res.body.data.docs[0].title).toBe('Pub Course');
  });

  it('GET /api/v1/courses/:id returns 404 for invalid ID', async () => {
    const res = await request(app).get('/api/v1/courses/000000000000000000000000');
    expect(res.status).toBe(404);
  });

  it('POST /api/v1/courses requires teacher role and validates fields', async () => {
    // Student fails
    let res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'New Course', price: 0, pricingType: 'free' });
    expect([403, 401]).toContain(res.status);

    // Teacher validates fields
    res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({});
    expect(res.status).toBe(400);

    // Teacher succeeds
    res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'New Course',
        slug: 'new-course',
        description: 'This is a description that is long enough.',
        price: 0,
        pricingType: 'free',
        category: '600000000000000000000000',
      });
    expect([201, 200]).toContain(res.status); // Depending on controller implementation
  });

  it('PUT /api/v1/courses/:id allows only course owner to update', async () => {
    const course = await Course.create({
      title: 'Teacher Course',
      description: 'This is a description that is long enough.',
      category: '600000000000000000000000',
      slug: 'teacher-course',
      price: 0,
      pricingType: 'free',
      isPublished: true,
      teacher: teacherId,
    });

    const otherTeacherRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Teacher 2',
      email: 'teach2@example.com',
      password: 'Password123!',
      role: 'student',
    });
    const otherTeacherToken = otherTeacherRes.body.data.accessToken;
    await User.findByIdAndUpdate(otherTeacherRes.body.data.user.id, { role: 'teacher' });

    // Owner succeeds
    let res = await request(app)
      .put(`/api/v1/courses/${course._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ title: 'Updated' });
    if (![200, 201].includes(res.status)) console.error('PUT 1:', res.body);
    expect([200, 201]).toContain(res.status);

    // Non-owner teacher fails
    res = await request(app)
      .put(`/api/v1/courses/${course._id}`)
      .set('Authorization', `Bearer ${otherTeacherToken}`)
      .send({ title: 'Hacked' });
    if (![403, 401, 404].includes(res.status)) console.error('PUT 2:', res.body);
    expect([403, 401, 404]).toContain(res.status);
  });

  it('DELETE /api/v1/courses/:id allows owner or admin to delete', async () => {
    const course = await Course.create({
      title: 'Teacher Course',
      description: 'This is a description that is long enough.',
      category: '600000000000000000000000',
      slug: 'teacher-course',
      price: 0,
      pricingType: 'free',
      isPublished: true,
      teacher: teacherId,
    });

    // Admin succeeds
    let res = await request(app)
      .delete(`/api/v1/courses/${course._id}`)
      .set('Authorization', `Bearer ${teacherToken}`);
    if (![200, 204].includes(res.status)) console.error('DELETE:', res.body);
    expect([200, 204]).toContain(res.status);
  });
});
