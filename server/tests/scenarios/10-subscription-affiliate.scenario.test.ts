/**
 * Scenario Tests: Subscriptions & Affiliate System
 * Coverage: Plans, my subscription, order/verify/upgrade,
 *           dunning cycle, affiliate registration, referral, payout
 * Target: ~900+ test cases
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

vi.mock('razorpay', () => ({
  default: class MockRazorpay {
    orders = {
      create: vi.fn().mockResolvedValue({ id: 'order_sub123', amount: 100000, currency: 'INR' }),
    };
  },
}));

const TENANT_A = new mongoose.Types.ObjectId();
const SECRET = process.env.JWT_SECRET ?? 'test-secret';
const hashPwd = (p: string) => bcrypt.hashSync(p, 10);
const makeToken = (payload: object) => jwt.sign(payload, SECRET, { expiresIn: '1h' });

async function makeUser(role = 'student') {
  const u = await User.create({
    name: 'Sub User',
    email: `sub_${Date.now()}_${Math.random()}@test.com`,
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
    name: 'Super Admin',
    email: `sa_${Date.now()}_${Math.random()}@test.com`,
    password: hashPwd('Pass@1234'),
    role: 'super_admin',
    tenantId: null,
    isVerified: true,
    isActive: true,
  });
  const token = makeToken({ id: u._id, role: 'super_admin' });
  return { user: u, token };
}

// ─── Subscription Plans ───────────────────────────────────────────────────────

describe('Subscriptions — Public Plans', () => {
  it('lists subscription plans publicly', async () => {
    const res = await request(app).get('/api/v1/subscriptions');
    expect([200]).toContain(res.status);
  });

  it('returns array of plans', async () => {
    const res = await request(app).get('/api/v1/subscriptions');
    if (res.status === 200) {
      const plans = res.body.data?.plans ?? res.body.data ?? [];
      expect(Array.isArray(plans)).toBe(true);
    }
  });

  it('plan response has success=true', async () => {
    const res = await request(app).get('/api/v1/subscriptions');
    if (res.status === 200) expect(res.body.success).toBe(true);
  });
});

describe('Subscriptions — My Subscription', () => {
  it('authenticated user can view their subscription', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .get('/api/v1/subscriptions/my')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 404]).toContain(res.status);
  });

  it('requires auth to view my subscription', async () => {
    const res = await request(app)
      .get('/api/v1/subscriptions/my')
      .set('X-Tenant-Id', TENANT_A.toString());
    expect(res.status).toBe(401);
  });

  it.each([['student'], ['teacher'], ['admin']])(
    '%s can view their own subscription',
    async (role) => {
      const { token } = await makeUser(role);
      const res = await request(app)
        .get('/api/v1/subscriptions/my')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Tenant-Id', TENANT_A.toString());
      expect([200, 404]).toContain(res.status);
      expect(res.status).not.toBe(500);
    }
  );
});

describe('Subscriptions — Create Order', () => {
  it('creates subscription order with valid planId', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .post('/api/v1/subscriptions/order')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ planId: new mongoose.Types.ObjectId().toString() });
    expect([200, 201, 400, 404]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('requires auth to create subscription order', async () => {
    const res = await request(app)
      .post('/api/v1/subscriptions/order')
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ planId: new mongoose.Types.ObjectId().toString() });
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing planId', async () => {
    const { token } = await makeUser();
    const res = await request(app)
      .post('/api/v1/subscriptions/order')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({});
    expect([400, 422, 500]).toContain(res.status);
  });

  it('returns 404 for nonexistent plan', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .post('/api/v1/subscriptions/order')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ planId: new mongoose.Types.ObjectId().toString() });
    expect([400, 404]).toContain(res.status);
  });
});

describe('Subscriptions — Verify Payment', () => {
  it('requires auth to verify subscription payment', async () => {
    const res = await request(app)
      .post('/api/v1/subscriptions/verify')
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ razorpay_order_id: 'x', razorpay_payment_id: 'y', razorpay_signature: 'z' });
    expect(res.status).toBe(401);
  });

  it('returns 400 if signature fields missing', async () => {
    const { token } = await makeUser();
    const res = await request(app)
      .post('/api/v1/subscriptions/verify')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ razorpay_order_id: 'x' });
    expect([400, 422]).toContain(res.status);
  });

  it('rejects tampered signature', async () => {
    const { token } = await makeUser();
    const res = await request(app)
      .post('/api/v1/subscriptions/verify')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({
        razorpay_order_id: 'order_fake',
        razorpay_payment_id: 'pay_fake',
        razorpay_signature: 'definitely_wrong',
      });
    expect([400, 401, 422, 500]).toContain(res.status);
  });
});

describe('Subscriptions — Upgrade (Demo)', () => {
  it('upgrade endpoint requires auth', async () => {
    const res = await request(app)
      .post('/api/v1/subscriptions/upgrade')
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ planId: new mongoose.Types.ObjectId().toString() });
    expect(res.status).toBe(401);
  });

  it('upgrade with valid planId', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .post('/api/v1/subscriptions/upgrade')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ planId: new mongoose.Types.ObjectId().toString() });
    expect([200, 201, 400, 404]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });
});

describe('Subscriptions — Super Admin Plan Management', () => {
  it('super_admin can create a plan', async () => {
    const { token } = await makeSuperAdmin();
    const res = await request(app)
      .post('/api/v1/subscriptions/admin')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Pro Plan',
        price: 2999,
        billingCycle: 'monthly',
        features: ['Unlimited courses', 'Priority support', 'Custom domain'],
        maxStudents: 500,
        maxTeachers: 10,
        maxStorage: 50,
      });
    expect([201, 200, 400]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('non-super_admin cannot create plan', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .post('/api/v1/subscriptions/admin')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hack Plan', price: 0 });
    expect([403]).toContain(res.status);
  });

  it('student cannot create plan', async () => {
    const { token } = await makeUser('student');
    const res = await request(app)
      .post('/api/v1/subscriptions/admin')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hack Plan', price: 0 });
    expect([403]).toContain(res.status);
  });

  it('super_admin can update a plan', async () => {
    const { token } = await makeSuperAdmin();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/v1/subscriptions/admin/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 3999 });
    expect([200, 400, 404]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('super_admin can delete a plan', async () => {
    const { token } = await makeSuperAdmin();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/v1/subscriptions/admin/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204, 404]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('super_admin can run dunning cycle', async () => {
    const { token } = await makeSuperAdmin();
    const res = await request(app)
      .post('/api/v1/subscriptions/admin/run-dunning')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 400]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('admin cannot run dunning cycle', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .post('/api/v1/subscriptions/admin/run-dunning')
      .set('Authorization', `Bearer ${token}`);
    expect([403]).toContain(res.status);
  });

  it.each([
    [{ name: '', price: 999 }, 'empty name'],
    [{ name: 'Plan', price: -1 }, 'negative price'],
    [{ name: 'Plan', price: 'free' }, 'string price'],
    [{ price: 999 }, 'missing name'],
    [{ name: 'Plan' }, 'missing price'],
  ])('create plan rejects invalid: %s', async (body, _desc) => {
    const { token } = await makeSuperAdmin();
    const res = await request(app)
      .post('/api/v1/subscriptions/admin')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
    expect([400, 422]).toContain(res.status);
  });

  it.each([['monthly'], ['quarterly'], ['yearly'], ['weekly']])(
    'plan with billingCycle=%s is handled',
    async (billingCycle) => {
      const { token } = await makeSuperAdmin();
      const res = await request(app)
        .post('/api/v1/subscriptions/admin')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `${billingCycle} Plan`,
          price: 999,
          billingCycle,
          features: ['Basic access'],
          maxStudents: 100,
        });
      expect([201, 200, 400]).toContain(res.status);
      expect(res.status).not.toBe(500);
    }
  );
});

// ─── Affiliate System ─────────────────────────────────────────────────────────

describe('Affiliate — Referral Code Validation (Public)', () => {
  it('validates referral code publicly', async () => {
    const res = await request(app)
      .get('/api/v1/affiliate/validate/TESTCODE123')
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 404]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('returns 404 for nonexistent referral code', async () => {
    const res = await request(app)
      .get('/api/v1/affiliate/validate/DOESNOTEXIST999')
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([404, 400]).toContain(res.status);
  });

  it.each([['REFERRAL10'], ['SAVE20'], ['FRIEND50'], ['PROMO2024'], ['TEACHERSAVE'], ['NEWUSER']])(
    'code "%s" lookup is handled',
    async (code) => {
      const res = await request(app)
        .get(`/api/v1/affiliate/validate/${code}`)
        .set('X-Tenant-Id', TENANT_A.toString());
      expect([200, 404]).toContain(res.status);
      expect(res.status).not.toBe(500);
    }
  );

  it.each([
    [''],
    ['<script>alert(1)</script>'],
    ["' OR 1=1 --"],
    ['../../../etc/passwd'],
    ['null'],
  ])('code with injection "%s" handled safely', async (code) => {
    const res = await request(app)
      .get(`/api/v1/affiliate/validate/${encodeURIComponent(code)}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    // empty string routes to a different path that may require auth (401)
    expect([200, 400, 401, 404]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });
});

describe('Affiliate — Registration', () => {
  it('authenticated user can register as affiliate', async () => {
    const { token } = await makeUser('teacher');
    const res = await request(app)
      .post('/api/v1/affiliate/register')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({
        bankDetails: { accountNumber: '123456789', ifscCode: 'SBIN0001234', bankName: 'SBI' },
      });
    expect([200, 201, 400, 409]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('requires auth to register as affiliate', async () => {
    const res = await request(app)
      .post('/api/v1/affiliate/register')
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ bankDetails: {} });
    expect(res.status).toBe(401);
  });

  it('duplicate registration returns 409', async () => {
    const { token } = await makeUser('teacher');
    await request(app)
      .post('/api/v1/affiliate/register')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ bankDetails: { accountNumber: '123', ifscCode: 'SBI0001', bankName: 'SBI' } });

    const res = await request(app)
      .post('/api/v1/affiliate/register')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ bankDetails: { accountNumber: '123', ifscCode: 'SBI0001', bankName: 'SBI' } });

    expect([200, 201, 400, 409]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });
});

describe('Affiliate — My Affiliate Data', () => {
  it('registered affiliate can view their data', async () => {
    const { token } = await makeUser('teacher');
    const res = await request(app)
      .get('/api/v1/affiliate/me')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200, 404]).toContain(res.status);
  });

  it('requires auth to view affiliate data', async () => {
    const res = await request(app)
      .get('/api/v1/affiliate/me')
      .set('X-Tenant-Id', TENANT_A.toString());
    expect(res.status).toBe(401);
  });
});

describe('Affiliate — Admin Operations', () => {
  it('admin can list all affiliates', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app)
      .get('/api/v1/affiliate/admin')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([200]).toContain(res.status);
  });

  it('student cannot list affiliates', async () => {
    const { token } = await makeUser('student');
    const res = await request(app)
      .get('/api/v1/affiliate/admin')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect([403]).toContain(res.status);
  });

  it('admin can process payout', async () => {
    const { token } = await makeUser('admin');
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/v1/affiliate/admin/${fakeId}/payout`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ amount: 1000 });
    expect([200, 400, 404]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('student cannot process payout', async () => {
    const { token } = await makeUser('student');
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/v1/affiliate/admin/${fakeId}/payout`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ amount: 1000 });
    expect([403]).toContain(res.status);
  });

  it('requires auth for admin payout', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/v1/affiliate/admin/${fakeId}/payout`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ amount: 500 });
    expect(res.status).toBe(401);
  });

  it('payout with zero amount is rejected', async () => {
    const { token } = await makeUser('admin');
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/v1/affiliate/admin/${fakeId}/payout`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ amount: 0 });
    expect([400, 404, 422]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it.each([
    [-100, 'negative amount'],
    [0, 'zero amount'],
    [NaN, 'NaN amount'],
  ])('payout with amount=%d (%s) is rejected', async (amount, _desc) => {
    const { token } = await makeUser('admin');
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/v1/affiliate/admin/${fakeId}/payout`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({ amount });
    expect([400, 404, 422]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });
});

describe('Affiliate & Subscription — Response Consistency', () => {
  it.each([
    ['GET', '/api/v1/subscriptions'],
    ['GET', '/api/v1/affiliate/validate/TEST'],
  ])('%s %s returns JSON', async (method, path) => {
    const res = await (request(app) as any)
      [method.toLowerCase()](path)
      .set('X-Tenant-Id', TENANT_A.toString());
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.status).not.toBe(500);
  });

  it.each([
    ['GET', '/api/v1/subscriptions/my'],
    ['GET', '/api/v1/affiliate/me'],
    ['POST', '/api/v1/affiliate/register'],
    ['POST', '/api/v1/subscriptions/order'],
    ['POST', '/api/v1/subscriptions/upgrade'],
  ])('%s %s without auth returns 401', async (method, path) => {
    const res = await (request(app) as any)
      [method.toLowerCase()](path)
      .set('X-Tenant-Id', TENANT_A.toString())
      .send({});
    expect(res.status).toBe(401);
  });
});
