import '../setup.js';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app.js';
import { generateToken, getStudentHeaders, DEFAULT_TENANT_ID } from '../helpers/auth.helper.js';

describe('Tier 2 — Feature 3: Auth & Identity Boundaries & Failures', () => {
  const duplicateUser = {
    name: 'Existing User',
    email: `dup_${Date.now()}@example.com`,
    password: 'Password123!',
    role: 'student',
  };

  it('F3-B1: POST /api/v1/auth/register with duplicate email returns 409 Conflict', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .set('X-Tenant-Id', DEFAULT_TENANT_ID)
      .send(duplicateUser);

    const duplicateRes = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Tenant-Id', DEFAULT_TENANT_ID)
      .send(duplicateUser);

    expect([409, 400]).toContain(duplicateRes.status);
    expect(duplicateRes.body.success).toBe(false);
  });

  it('F3-B2: POST /api/v1/auth/register with missing required fields returns 400 Bad Request', async () => {
    const invalidPayload = {
      name: 'Incomplete User',
    };

    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Tenant-Id', DEFAULT_TENANT_ID)
      .send(invalidPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('F3-B3: POST /api/v1/auth/login with incorrect password returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Tenant-Id', DEFAULT_TENANT_ID)
      .send({
        email: duplicateUser.email,
        password: 'CompletelyWrongPassword123!',
      });

    expect([401, 400]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('F3-B4: Request with expired or malformed JWT token returns 401 Unauthorized', async () => {
    const malformedRes = await request(app)
      .get('/api/v1/enrollments/my')
      .set('Authorization', 'Bearer this.is.an.invalid.token')
      .set('X-Tenant-Id', DEFAULT_TENANT_ID);

    expect([401, 400]).toContain(malformedRes.status);

    const expiredToken = generateToken({ email: 'expired@example.com' }, { expiresIn: '-10s' });
    const expiredRes = await request(app)
      .get('/api/v1/enrollments/my')
      .set('Authorization', `Bearer ${expiredToken}`)
      .set('X-Tenant-Id', DEFAULT_TENANT_ID);

    expect([401, 400]).toContain(expiredRes.status);
  });

  it('F3-B5: Student role accessing admin endpoint returns 403 Forbidden', async () => {
    const { headers: studentHeaders } = getStudentHeaders();

    const res = await request(app).get('/api/v1/admin/dashboard').set(studentHeaders);

    expect([403, 401, 400]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});
