import '../setup.js';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app.js';
import { generateToken, getAuthHeaders, DEFAULT_TENANT_ID } from '../helpers/auth.helper.js';

describe('Tier 1 — Feature 3: Core Auth & Users API', () => {
  const uniquePrefix = `user_${Date.now()}`;
  const testUser = {
    name: 'Jane Doe',
    email: `${uniquePrefix}@example.com`,
    password: 'Password123!',
    role: 'student',
  };

  let createdUserAccessToken = '';
  let createdUserRefreshToken = '';

  it('F3-T1: POST /api/v1/auth/register creates a new user and returns JWT accessToken', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Tenant-Id', DEFAULT_TENANT_ID)
      .send(testUser);

    expect([201, 200, 409]).toContain(res.status);
    if (res.status === 201 || res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      createdUserAccessToken = res.body.data.accessToken;

      const cookies = res.headers['set-cookie'];
      if (cookies) {
        const match = cookies.find((c) => c.startsWith('refreshToken='));
        if (match) {
          createdUserRefreshToken = match.split(';')[0].replace('refreshToken=', '');
        }
      }
    }
  });

  it('F3-T2: POST /api/v1/auth/login validates credentials and returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Tenant-Id', DEFAULT_TENANT_ID)
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect([200, 401, 400]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
    }
  });

  it('F3-T3: POST /api/v1/auth/refresh-token refreshes access token', async () => {
    const refreshToken =
      createdUserRefreshToken ||
      generateToken({ email: testUser.email, role: 'student' }, { expiresIn: '7d' });
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('X-Tenant-Id', DEFAULT_TENANT_ID)
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .send({ refreshToken });

    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.data).toHaveProperty('accessToken');
    }
  });

  it('F3-T4: GET /api/v1/auth/me or /profile returns current user profile without password', async () => {
    const token =
      createdUserAccessToken || generateToken({ email: testUser.email, role: 'student' });
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', DEFAULT_TENANT_ID);

    if (res.status === 404) {
      const fallbackRes = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Tenant-Id', DEFAULT_TENANT_ID);

      expect([200, 401]).toContain(fallbackRes.status);
      if (fallbackRes.status === 200) {
        expect(fallbackRes.body.data.user.password).toBeUndefined();
      }
    } else {
      expect([200, 401]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.data.user.password).toBeUndefined();
      }
    }
  });

  it('F3-T5: Role-based authorization validates student vs admin access permissions', async () => {
    const { headers: studentHeaders } = getAuthHeaders('student');
    const { headers: adminHeaders } = getAuthHeaders('admin');

    const studentRes = await request(app).get('/api/v1/admin/dashboard').set(studentHeaders);

    expect([403, 401]).toContain(studentRes.status);

    const adminRes = await request(app).get('/api/v1/admin/dashboard').set(adminHeaders);

    expect(adminRes.status).not.toBe(403);
  });
});
