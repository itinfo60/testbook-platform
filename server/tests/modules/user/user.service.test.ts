import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';

const mockRedisStore = new Map<string, any>();

vi.mock('../../../src/config/redis.js', () => ({
  default: {
    isConnected: true,
    get: vi.fn(async (key: string) => mockRedisStore.get(key)),
    set: vi.fn(async (key: string, value: any) => {
      mockRedisStore.set(key, value);
      return true;
    }),
    del: vi.fn(async (key: string) => {
      mockRedisStore.delete(key);
      return true;
    }),
    flush: vi.fn(async () => {
      mockRedisStore.clear();
      return true;
    }),
  },
}));

import { UserService } from '../../../src/modules/user/user.service.js';
import User from '../../../src/modules/user/user.model.js';
import redis from '../../../src/config/redis.js';
import { runWithTenant } from '../../../src/core/tenant.context.js';

describe('UserService (Administrative)', () => {
  let userService: UserService;
  const mockTenantId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    userService = new UserService();
    await User.deleteMany({});
    await redis.flush();
    vi.clearAllMocks();
  });

  it('should create a user successfully', async () => {
    const user = await runWithTenant(mockTenantId, false, () =>
      userService.createUser(
        {
          name: 'John AdminCreated',
          email: 'john-admin@test.com',
          password: 'Password123!',
          role: 'student',
        },
        mockTenantId
      )
    );

    expect(user.name).toBe('John AdminCreated');
    expect(user.email).toBe('john-admin@test.com');
    expect(user.role).toBe('student');
    expect(user.isEmailVerified).toBe(true);
    expect(user.tenantId.toString()).toBe(mockTenantId);
  });

  it('should retrieve tenant-specific user list', async () => {
    // 1. User inside mockTenantId
    await runWithTenant(mockTenantId, false, () =>
      userService.createUser(
        { name: 'User A', email: 'a@test.com', password: 'Password123!', role: 'student' },
        mockTenantId
      )
    );

    // 2. User inside anotherTenantId
    const anotherTenantId = new mongoose.Types.ObjectId().toString();
    await runWithTenant(anotherTenantId, false, () =>
      userService.createUser(
        { name: 'User B', email: 'b@test.com', password: 'Password123!', role: 'student' },
        anotherTenantId
      )
    );

    // Run query inside mockTenantId context
    const result = await runWithTenant(mockTenantId, false, () =>
      userService.getUsers({ page: 1, limit: 10 })
    );

    expect(result.total).toBe(1);
    expect(result.docs[0].name).toBe('User A');
  });

  it('should update user role and clear cache', async () => {
    const user = await runWithTenant(mockTenantId, false, () =>
      userService.createUser(
        { name: 'User A', email: 'a@test.com', password: 'Password123!', role: 'student' },
        mockTenantId
      )
    );

    await redis.set(`user_${user._id}`, { name: 'User A', role: 'student' }, 100);

    const updated = await runWithTenant(mockTenantId, false, () =>
      userService.updateUserRole(user._id.toString(), 'teacher')
    );
    expect(updated.role).toBe('teacher');

    const cached = await redis.get(`user_${user._id}`);
    expect(cached).toBeUndefined();
  });
});
