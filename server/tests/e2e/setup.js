import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.example' });

// Ensure required environment variables are set before any module imports
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '5000';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'supersecrettestjwtkeythatis32charslong!';
process.env.ALLOW_MOCK_PAYMENTS = 'true';

export const DEFAULT_TENANT = {
  id: '00000000-0000-0000-0000-000000000001',
  _id: '00000000-0000-0000-0000-000000000001',
  name: 'Default Institute',
  subdomain: 'default',
  websiteTitle: 'CivicsHub Platform',
  isActive: true,
  subscription: {
    status: 'active',
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  limits: {
    studentLimit: 10000,
    teacherLimit: 1000,
    storageLimit: 10 * 1024 * 1024 * 1024,
  },
};

// In-memory Redis store for isolated test execution
export const mockRedisStore = new Map();
export const mockUserStore = new Map();

function resetTenantStore() {
  mockRedisStore.set('tenant:id:00000000-0000-0000-0000-000000000001', DEFAULT_TENANT);
  mockRedisStore.set('tenant:id:00000000-0000-0000-0000-000000000002', {
    ...DEFAULT_TENANT,
    id: '00000000-0000-0000-0000-000000000002',
    _id: '00000000-0000-0000-0000-000000000002',
    name: 'Tenant 2',
    subdomain: 'tenant2',
  });
  mockRedisStore.set('tenant:subdomain:default', DEFAULT_TENANT);
  mockRedisStore.set('tenant:subdomain:127', DEFAULT_TENANT);
  mockRedisStore.set('tenant:subdomain:localhost', DEFAULT_TENANT);
}

vi.mock('../../src/config/redis.js', () => ({
  default: {
    isConnected: true,
    get: vi.fn(async (k) => {
      if (mockRedisStore.has(k)) {
        return mockRedisStore.get(k);
      }
      if (k && k.startsWith('tenant:')) {
        return DEFAULT_TENANT;
      }
      return null;
    }),
    set: vi.fn(async (k, v) => {
      mockRedisStore.set(k, v);
      return true;
    }),
    del: vi.fn(async (k) => {
      mockRedisStore.delete(k);
      return true;
    }),
    flush: vi.fn(async () => {
      mockRedisStore.clear();
      resetTenantStore();
      return true;
    }),
    delPattern: vi.fn(async (pattern) => {
      let count = 0;
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      for (const key of mockRedisStore.keys()) {
        if (regex.test(key)) {
          mockRedisStore.delete(key);
          count++;
        }
      }
      return count;
    }),
    setex: vi.fn(async (k, _t, v) => {
      mockRedisStore.set(k, v);
      return true;
    }),
    connect: vi.fn().mockResolvedValue(true),
    disconnect: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../../src/queues/index.js', () => ({
  transactionalEmailQueue: { add: vi.fn().mockResolvedValue({ id: 'job_1' }) },
  bulkEmailQueue: { add: vi.fn().mockResolvedValue({ id: 'job_2' }) },
  notificationQueue: { add: vi.fn().mockResolvedValue({ id: 'job_3' }) },
  certificateQueue: { add: vi.fn().mockResolvedValue({ id: 'job_4' }) },
  dripQueue: { add: vi.fn().mockResolvedValue({ id: 'job_5' }) },
  reminderQueue: { add: vi.fn().mockResolvedValue({ id: 'job_6' }) },
  dunningQueue: { add: vi.fn().mockResolvedValue({ id: 'job_7' }) },
  analyticsQueue: { add: vi.fn().mockResolvedValue({ id: 'job_8' }) },
  drainFailedJobs: vi.fn().mockResolvedValue(0),
}));

vi.mock('../../src/config/cloudinary.js', () => ({
  default: {
    uploader: {
      upload: vi.fn().mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        public_id: 'sample_id',
      }),
    },
  },
}));

vi.mock('razorpay', () => {
  class MockRazorpay {
    orders = {
      create: vi.fn().mockResolvedValue({
        id: 'order_test123',
        amount: 99900,
        currency: 'INR',
        receipt: 'rcpt_123',
      }),
    };
    payments = {
      fetch: vi.fn().mockResolvedValue({
        id: 'pay_test123',
        status: 'captured',
        order_id: 'order_test123',
        amount: 99900,
      }),
    };
  }
  return { default: MockRazorpay };
});

import prisma from '../../src/config/prisma.js';
import redis from '../../src/config/redis.js';

if (redis) {
  vi.spyOn(redis, 'get').mockImplementation(async (k) => {
    if (mockRedisStore.has(k)) return mockRedisStore.get(k);
    if (k && k.startsWith('tenant:')) return DEFAULT_TENANT;
    return null;
  });
  vi.spyOn(redis, 'set').mockImplementation(async (k, v) => {
    mockRedisStore.set(k, v);
    return true;
  });
  vi.spyOn(redis, 'del').mockImplementation(async (k) => {
    mockRedisStore.delete(k);
    return true;
  });
}

if (prisma) {
  if (prisma.institute) {
    vi.spyOn(prisma.institute, 'findUnique').mockImplementation(async () => DEFAULT_TENANT);
    vi.spyOn(prisma.institute, 'findFirst').mockImplementation(async () => DEFAULT_TENANT);
    vi.spyOn(prisma.institute, 'findMany').mockImplementation(async () => [DEFAULT_TENANT]);
  }
}

beforeAll(async () => {
  resetTenantStore();
});

afterEach(async () => {
  mockRedisStore.clear();
  resetTenantStore();
});

afterAll(async () => {
  mockRedisStore.clear();
});
