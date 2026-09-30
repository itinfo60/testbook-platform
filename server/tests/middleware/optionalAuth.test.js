import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

vi.mock('../../src/config/prisma.js', () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));
vi.mock('../../src/config/redis.js', () => ({ default: { get: vi.fn() } }));
vi.mock('../../src/config/index.js', () => ({
  default: { jwt: { secret: 'optional-auth-regression-test-secret' } },
}));
vi.mock('../../src/config/supabase.js', () => ({ getSupabase: vi.fn() }));

import { optionalAuth } from '../../src/middleware/auth.js';
import { prisma } from '../../src/config/prisma.js';
import redis from '../../src/config/redis.js';
import config from '../../src/config/index.js';

const activeUser = {
  id: 'user-1',
  role: 'student',
  isActive: true,
  password: 'not-for-the-request',
};
const signedToken = (payload = {}) =>
  jwt.sign({ id: activeUser.id, ...payload }, config.jwt.secret, { expiresIn: '5m' });

async function invoke(token, scheme = 'Bearer') {
  const req = { headers: token ? { authorization: `${scheme} ${token}` } : {} };
  const next = vi.fn();
  await optionalAuth(req, {}, next);
  expect(next).toHaveBeenCalledExactlyOnceWith();
  return req;
}

beforeEach(() => {
  vi.resetAllMocks();
  redis.get.mockResolvedValue(null);
  prisma.user.findUnique.mockResolvedValue(activeUser);
});

describe('Optional authentication identity boundary', () => {
  it('allows anonymous requests without looking up a user', async () => {
    const req = await invoke();
    expect(req.user).toBeUndefined();
    expect(req.userId).toBeUndefined();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it.each([
    [
      'a forged admin token',
      () => jwt.sign({ id: activeUser.id, role: 'admin' }, 'attacker-secret'),
    ],
    [
      'an expired token',
      () => jwt.sign({ id: activeUser.id }, config.jwt.secret, { expiresIn: -1 }),
    ],
    [
      'an unsigned token',
      () => jwt.sign({ id: activeUser.id, role: 'admin' }, '', { algorithm: 'none' }),
    ],
    ['a malformed token', () => 'not-a-jwt'],
    ['a verified token without a user ID', () => jwt.sign({ role: 'admin' }, config.jwt.secret)],
  ])('treats %s as anonymous rather than trusting its payload', async (_label, token) => {
    const req = await invoke(token());
    expect(req.user).toBeUndefined();
    expect(req.userId).toBeUndefined();
    expect(redis.get).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('uses the active database identity, not role claims, after verification', async () => {
    const req = await invoke(signedToken({ role: 'admin' }), 'bEaReR');
    expect(req.user).toEqual({
      id: activeUser.id,
      _id: activeUser.id,
      role: 'student',
      isActive: true,
    });
    expect(req.userId).toBe(activeUser.id);
    expect(req.user).not.toHaveProperty('password');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: activeUser.id } });
  });

  it('accepts an active cached identity after token verification', async () => {
    const cachedUser = { id: activeUser.id, role: 'student', isActive: true };
    redis.get.mockResolvedValue(cachedUser);
    const req = await invoke(signedToken());
    expect(req.user).toEqual(cachedUser);
    expect(req.userId).toBe(activeUser.id);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it.each([null, { ...activeUser, isActive: false }])(
    'does not synthesize an identity for a missing or inactive database user',
    async (user) => {
      prisma.user.findUnique.mockResolvedValue(user);
      const req = await invoke(signedToken({ role: 'admin' }));
      expect(req.user).toBeUndefined();
      expect(req.userId).toBeUndefined();
    }
  );

  it('does not authenticate an inactive cached user', async () => {
    redis.get.mockResolvedValue({ ...activeUser, isActive: false });
    const req = await invoke(signedToken());
    expect(req.user).toBeUndefined();
    expect(req.userId).toBeUndefined();
  });

  it('uses the database when Redis is unavailable', async () => {
    redis.get.mockRejectedValue(new Error('Redis offline'));
    const req = await invoke(signedToken());
    expect(req.userId).toBe(activeUser.id);
  });

  it('stays anonymous when no trusted user can be loaded', async () => {
    redis.get.mockRejectedValue(new Error('Redis offline'));
    prisma.user.findUnique.mockRejectedValue(new Error('Database offline'));
    const req = await invoke(signedToken({ role: 'admin' }));
    expect(req.user).toBeUndefined();
    expect(req.userId).toBeUndefined();
  });
});
