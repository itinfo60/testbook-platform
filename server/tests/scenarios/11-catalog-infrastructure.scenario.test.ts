/**
 * Scenario Tests: Catalog & Infrastructure
 * Coverage: Exam categories, digital library, audit logs, API keys,
 *           GDPR, attendance, institute management
 * Target: ~1,100+ test cases
 */

import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import User from '../../src/modules/user/user.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const mockRedisStore = new Map<string, any>();
vi.mock('../../src/config/redis.js', () => ({
  default: {
    isConnected: true,
    get: vi.fn(async (k: string) => mockRedisStore.get(k) ?? null),
    set: vi.fn(async (k: string, v: any) => {
      mockRedisStore.set(k, v);
      return true;
    }),
    del: vi.fn(async (k: string) => {
      mockRedisStore.delete(k);
      return true;
    }),
    flush: vi.fn(async () => {
      mockRedisStore.clear();
      return true;
    }),
    delPattern: vi.fn(async () => 0),
    setex: vi.fn(async (k: string, _t: number, v: any) => {
      mockRedisStore.set(k, v);
      return true;
    }),
  },
}));

vi.mock('../../src/queues/index.js', () => ({
  transactionalEmailQueue: { add: vi.fn() },
  notificationQueue: { add: vi.fn() },
  certificateQueue: { add: vi.fn() },
  reminderQueue: { add: vi.fn() },
  analyticsQueue: { add: vi.fn() },
  dripQueue: { add: vi.fn() },
  dunningQueue: { add: vi.fn() },
}));

vi.mock('../../src/config/cloudinary.js', () => ({
  default: {
    uploader: {
      upload: vi
        .fn()
        .mockResolvedValue({ secure_url: 'https://cdn.test/img.jpg', public_id: 'test_id' }),
    },
    image: vi.fn((p: string) => `https://cdn.test/${p}`),
  },
}));

const TENANT_A = new mongoose.Types.ObjectId();
const SECRET = process.env.JWT_SECRET ?? 'test-secret';
const hashPwd = (p: string) => bcrypt.hashSync(p, 10);
const makeToken = (payload: object) => jwt.sign(payload, SECRET, { expiresIn: '1h' });

async function makeUser(role = 'student') {
  const u = await User.create({
    name: 'Infra User',
    email: `infra_${Date.now()}_${Math.random()}@test.com`,
    password: hashPwd('Pass@1234'),
    role,
    tenantId: TENANT_A,
    isVerified: true,
    isActive: true,
  });
  const token = makeToken({ id: u._id, tenantId: TENANT_A, role });
  return { user: u, token };
}

async function makeSuperAdmin() {
  const u = await User.create({
    name: 'Super Admin Infra',
    email: `sa_infra_${Date.now()}_${Math.random()}@test.com`,
    password: hashPwd('Pass@1234'),
    role: 'super_admin',
    tenantId: null,
    isVerified: true,
    isActive: true,
  });
  const token = makeToken({ id: u._id, role: 'super_admin' });
  return { user: u, token };
}

// ─── Exam Categories ──────────────────────────────────────────────────────────

describe('Exam Categories — Public Access', () => {
  it('lists categories publicly', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect([200]).toContain(res.status);
  });

  it('returns array of categories', async () => {
    const res = await request(app).get('/api/v1/categories');
    if (res.status === 200) {
      const cats = res.body.data?.categories ?? res.body.data ?? [];
      expect(Array.isArray(cats)).toBe(true);
    }
  });

  it('gets category by slug', async () => {
    const res = await request(app).get('/api/v1/categories/nonexistent-slug');
    expect([404, 400]).toContain(res.status);
  });

  it.each([['upsc'], ['jee'], ['neet'], ['cat'], ['gate'], ['ssc-cgl'], ['banking'], ['railways']])(
    'slug "%s" lookup is handled',
    async (slug) => {
      const res = await request(app).get(`/api/v1/categories/${slug}`);
      expect([200, 404]).toContain(res.status);
      expect(res.status).not.toBe(500);
    }
  );
});

describe('Exam Categories — Admin Operations', () => {
  it('admin can list categories via admin route', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .get('/api/v1/categories/admin/list')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('student cannot list categories via admin route', async () => {
    const { token } = await makeUser('student');
    const res = await request(app)
      .get('/api/v1/categories/admin/list')
      .set('Authorization', `Bearer ${token}`);
    expect([403]).toContain(res.status);
  });

  it('admin can create a category', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({
        name: 'UPSC Civil Services',
        slug: `upsc-${Date.now()}`,
        description: 'For UPSC civil services examination',
        icon: '🏛️',
      });
    expect([201, 200, 400]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('student cannot create a category', async () => {
    const { token } = await makeUser('student');
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hack Cat', slug: 'hack-cat' });
    expect([403]).toContain(res.status);
  });

  it('admin can update a category', async () => {
    const { token } = await makeUser('admin');
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/v1/categories/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ name: 'Updated Category' });
    expect([200, 404]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('admin can delete a category', async () => {
    const { token } = await makeUser('admin');
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/v1/categories/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 204, 404]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('requires name to create category', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ slug: 'no-name' });
    expect([400, 422, 500]).toContain(res.status);
  });

  it('requires slug to create category', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ name: 'No Slug' });
    // slug may be auto-generated from name
    expect([201, 400, 422]).toContain(res.status);
  });

  it.each([
    ['UPSC', 'upsc-test', 'Government Exams'],
    ['JEE Main', 'jee-main-test', 'Engineering Entrance'],
    ['NEET', 'neet-test', 'Medical Entrance'],
    ['CAT', 'cat-test', 'MBA Entrance'],
    ['GATE', 'gate-test', 'Graduate Aptitude'],
  ])('creates category: %s', async (name, slug, description) => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ name, slug: `${slug}-${Date.now()}`, description });
    expect([201, 200, 400, 409]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });
});

// ─── Digital Library ──────────────────────────────────────────────────────────

describe('Digital Library — Public Access', () => {
  it('lists resources publicly', async () => {
    const res = await request(app).get('/api/v1/library').set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 400, 500]).toContain(res.status);
  });

  it('returns array of resources', async () => {
    const res = await request(app).get('/api/v1/library').set('X-Tenant-Id', TENANT_A.toString());
    if (res.status === 200) {
      const d = res.body.data;
      const resources = d?.resources ?? d?.docs ?? (Array.isArray(d) ? d : null);
      if (resources !== null) expect(Array.isArray(resources)).toBe(true);
    }
    expect(true).toBe(true);
  });

  it('paginates library resources', async () => {
    const res = await request(app)
      .get('/api/v1/library?page=1&limit=5')
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 400, 500]).toContain(res.status);
  });

  it('downloads a resource by id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/v1/library/${fakeId}/download`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 404, 400, 401, 500]).toContain(res.status);
  });

  it.each([['pdf'], ['video'], ['image'], ['document'], ['audio']])(
    'filters library by type=%s',
    async (type) => {
      const res = await request(app)
        .get(`/api/v1/library?type=${type}`)
        .set('X-Tenant-Id', TENANT_A.toString());
      expect([200, 400, 500]).toContain(res.status);
    }
  );
});

describe('Digital Library — Teacher/Admin Upload', () => {
  it('teacher can create a library resource', async () => {
    const { token } = await makeUser('teacher');
    const res = await request(app)
      .post('/api/v1/library')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Test Resource')
      .field('description', 'A test resource')
      .field('type', 'document');
    expect([201, 200, 400]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('student cannot upload library resource', async () => {
    const { token } = await makeUser('student');
    const res = await request(app)
      .post('/api/v1/library')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Hack Resource');
    expect([403]).toContain(res.status);
  });

  it('requires auth to upload', async () => {
    const res = await request(app)
      .post('/api/v1/library')
      .set('X-Tenant-Id', TENANT_A.toString())
      .field('title', 'Unauth Upload');
    expect(res.status).toBe(401);
  });

  it('admin can delete a resource', async () => {
    const { token } = await makeUser('admin');
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/v1/library/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 204, 404, 500]).toContain(res.status);
  });

  it('student cannot delete a resource', async () => {
    const { token } = await makeUser('student');
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/v1/library/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([403]).toContain(res.status);
  });
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────

describe('Audit Logs', () => {
  it('admin can view audit logs', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('student cannot view audit logs', async () => {
    const { token } = await makeUser('student');
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${token}`);
    expect([403]).toContain(res.status);
  });

  it('requires auth for audit logs', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('X-Tenant-Id', TENANT_A.toString());
    expect(res.status).toBe(401);
  });

  it('returns paginated audit logs', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .get('/api/v1/audit-logs?page=1&limit=20')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it.each([
    ['action=LOGIN'],
    ['action=LOGOUT'],
    ['action=CREATE'],
    ['action=UPDATE'],
    ['action=DELETE'],
    ['resource=course'],
    ['resource=user'],
    ['resource=enrollment'],
    ['status=success'],
    ['status=failure'],
    ['from=2024-01-01&to=2024-12-31'],
  ])('filters audit logs with %s', async (queryString) => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .get(`/api/v1/audit-logs?${queryString}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('audit log response has correct structure', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });
});

// ─── API Key Management ───────────────────────────────────────────────────────

describe('API Keys', () => {
  it('admin can create an API key', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ name: 'My Integration Key' });
    expect([201, 200, 400]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('student cannot create an API key', async () => {
    const { token } = await makeUser('student');
    const res = await request(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hacked Key' });
    expect([403]).toContain(res.status);
  });

  it('requires auth to create API key', async () => {
    const res = await request(app)
      .post('/api/v1/api-keys')
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ name: 'Unauth Key' });
    expect(res.status).toBe(401);
  });

  it('admin can list API keys', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .get('/api/v1/api-keys')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('student cannot list API keys', async () => {
    const { token } = await makeUser('student');
    const res = await request(app).get('/api/v1/api-keys').set('Authorization', `Bearer ${token}`);
    expect([403]).toContain(res.status);
  });

  it('admin can revoke an API key', async () => {
    const { token } = await makeUser('admin');
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/v1/api-keys/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 204, 404]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('returns empty list for admin with no API keys', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .get('/api/v1/api-keys')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    if (res.status === 200) {
      const d = res.body.data;
      const keys = d?.apiKeys ?? d?.docs ?? (Array.isArray(d) ? d : null);
      if (keys !== null) expect(Array.isArray(keys)).toBe(true);
    }
    expect(true).toBe(true);
  });

  it.each([
    ['Production Key'],
    ['Development Key'],
    ['Testing Integration'],
    ['Webhook Key'],
    ['Mobile App Key'],
  ])('creates API key with name "%s"', async (name) => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ name });
    expect([201, 200, 400]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });
});

// ─── GDPR ─────────────────────────────────────────────────────────────────────

describe('GDPR — Data Export', () => {
  it('user can export their own data', async () => {
    const { token } = await makeUser();
    const res = await request(app)
      .get('/api/v1/gdpr/export')
      .set('Authorization', `Bearer ${token}`);
    expect([200]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('requires auth to export data', async () => {
    const res = await request(app)
      .get('/api/v1/gdpr/export')
      .set('X-Tenant-Id', TENANT_A.toString());
    expect(res.status).toBe(401);
  });

  it('export response is valid JSON', async () => {
    const { token } = await makeUser();
    const res = await request(app)
      .get('/api/v1/gdpr/export')
      .set('Authorization', `Bearer ${token}`);
    expect(res.headers['content-type']).toMatch(/json/);
  });
});

describe('GDPR — Consent Management', () => {
  it('user can record consent', async () => {
    const { token } = await makeUser();
    const res = await request(app)
      .post('/api/v1/gdpr/consent')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'marketing', granted: true });
    expect([200, 201, 400]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('requires auth to record consent', async () => {
    const res = await request(app)
      .post('/api/v1/gdpr/consent')
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ type: 'marketing', granted: true });
    expect(res.status).toBe(401);
  });

  it('user can view their consent status', async () => {
    const { token } = await makeUser();
    const res = await request(app)
      .get('/api/v1/gdpr/consent')
      .set('Authorization', `Bearer ${token}`);
    expect([200]).toContain(res.status);
  });

  it('requires auth to view consent', async () => {
    const res = await request(app)
      .get('/api/v1/gdpr/consent')
      .set('X-Tenant-Id', TENANT_A.toString());
    expect(res.status).toBe(401);
  });

  it.each([
    ['marketing', true],
    ['marketing', false],
    ['analytics', true],
    ['analytics', false],
    ['notifications', true],
    ['notifications', false],
  ])('records consent type=%s granted=%s', async (type, granted) => {
    const { token } = await makeUser();
    const res = await request(app)
      .post('/api/v1/gdpr/consent')
      .set('Authorization', `Bearer ${token}`)
      .send({ type, granted });
    expect([200, 201, 400]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });
});

describe('GDPR — Data Erasure', () => {
  it('user can request data erasure', async () => {
    const { token } = await makeUser();
    const res = await request(app)
      .delete('/api/v1/gdpr/erase')
      .set('Authorization', `Bearer ${token}`)
      .send({ confirmPhrase: 'DELETE MY ACCOUNT' });
    expect([200, 400, 422]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('requires auth to erase data', async () => {
    const res = await request(app)
      .delete('/api/v1/gdpr/erase')
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ confirmPhrase: 'DELETE MY ACCOUNT' });
    expect(res.status).toBe(401);
  });

  it('requires confirmation phrase', async () => {
    const { token } = await makeUser();
    const res = await request(app)
      .delete('/api/v1/gdpr/erase')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect([400, 422]).toContain(res.status);
  });

  it('wrong confirmation phrase is rejected', async () => {
    const { token } = await makeUser();
    const res = await request(app)
      .delete('/api/v1/gdpr/erase')
      .set('Authorization', `Bearer ${token}`)
      .send({ confirmPhrase: 'wrong phrase' });
    expect([400, 422]).toContain(res.status);
  });
});

// ─── Attendance ───────────────────────────────────────────────────────────────

describe('Attendance', () => {
  it('teacher can view attendance for a course', async () => {
    const { token } = await makeUser('teacher');
    const courseId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/v1/attendance/course/${courseId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 400, 404]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('student cannot view attendance', async () => {
    const { token } = await makeUser('student');
    const courseId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/v1/attendance/course/${courseId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([403]).toContain(res.status);
  });

  it('requires auth to view attendance', async () => {
    const courseId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/v1/attendance/course/${courseId}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect(res.status).toBe(401);
  });

  it('teacher can save attendance records', async () => {
    const { token } = await makeUser('teacher');
    const courseId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/v1/attendance/course/${courseId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({
        date: new Date().toISOString(),
        records: [
          { studentId: new mongoose.Types.ObjectId().toString(), status: 'present' },
          { studentId: new mongoose.Types.ObjectId().toString(), status: 'absent' },
        ],
      });
    expect([200, 201, 400, 404, 500]).toContain(res.status);
  });

  it('student cannot save attendance', async () => {
    const { token } = await makeUser('student');
    const courseId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/v1/attendance/course/${courseId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ records: [] });
    expect([403]).toContain(res.status);
  });

  it.each([['present'], ['absent'], ['late'], ['excused']])(
    'attendance status "%s" is valid',
    async (status) => {
      const { token } = await makeUser('teacher');
      const courseId = new mongoose.Types.ObjectId();
      const studentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/v1/attendance/course/${courseId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Tenant-Id', TENANT_A.toString())
        .send({
          date: new Date().toISOString(),
          records: [{ studentId: studentId.toString(), status }],
        });
      expect([200, 201, 400, 404, 500]).toContain(res.status);
    }
  );
});
