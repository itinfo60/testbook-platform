import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import app from '../src/app.js';
import User from '../src/modules/user/user.model.ts';
import jwt from 'jsonwebtoken';
import config from '../src/config/index.js';
import redis from '../src/config/redis.js';

describe('Auth Routes', () => {
  const testUser = {
    name: 'Test User',
    email: 'testauth@example.com',
    password: 'Password123!',
    role: 'student',
  };

  beforeEach(async () => {
    vi.spyOn(redis, 'get').mockResolvedValue(null);
    vi.spyOn(redis, 'set').mockResolvedValue('OK');
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should return error for duplicate email', async () => {
      await request(app).post('/api/v1/auth/register').send(testUser);

      const res = await request(app).post('/api/v1/auth/register').send(testUser).expect(409);

      expect(res.body.success).toBe(false);
    });

    it('should return error for missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Test' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return error for invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, email: 'invalid-email' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(testUser);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should return error for wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword123!' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return error for nonexistent user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'Password123!' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return error for missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout and return success', async () => {
      const loginRes = await request(app).post('/api/v1/auth/register').send(testUser);

      const token = loginRes.body.data.accessToken;

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should return user profile without password', async () => {
      const loginRes = await request(app).post('/api/v1/auth/register').send(testUser);

      const token = loginRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should return 401 if missing token', async () => {
      const res = await request(app).get('/api/v1/auth/profile').expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should return success for valid email', async () => {
      await request(app).post('/api/v1/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return success even for nonexistent email (security best practice)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Auth Middleware', () => {
    it('should pass with valid token', async () => {
      const loginRes = await request(app).post('/api/v1/auth/register').send(testUser);
      const token = loginRes.body.data.accessToken;

      await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should return 401 with expired token', async () => {
      const user = await User.create(testUser);
      const token = jwt.sign({ id: user._id, type: 'access' }, config.jwt.secret, {
        expiresIn: '-1h',
      });

      await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('should return 401 with tampered token', async () => {
      const loginRes = await request(app).post('/api/v1/auth/register').send(testUser);
      const token = loginRes.body.data.accessToken + 'tamper';

      await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });
});
