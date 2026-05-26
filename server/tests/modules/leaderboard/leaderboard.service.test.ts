import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';

const mockRedisStore = new Map<string, any>();

vi.mock('../../../src/config/redis.js', () => ({
  default: {
    isConnected: true,
    get: vi.fn(async (key: string) => {
      const val = mockRedisStore.get(key);
      return val !== undefined ? JSON.stringify(val) : null;
    }),
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

import { LeaderboardService } from '../../../src/modules/leaderboard/leaderboard.service.js';
import User from '../../../src/modules/user/user.model.js';
import TestAttempt from '../../../src/modules/test/testAttempt.model.js';
import redis from '../../../src/config/redis.js';
import { runWithTenant } from '../../../src/core/tenant.context.js';

describe('LeaderboardService', () => {
  let leaderboardService: LeaderboardService;
  const tenantA = new mongoose.Types.ObjectId().toString();
  const tenantB = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    leaderboardService = new LeaderboardService();
    await User.deleteMany({});
    await TestAttempt.deleteMany({});
    await redis.flush();
    vi.clearAllMocks();
  });

  describe('getLeaderboard (all-time, points-based)', () => {
    it('should return empty leaderboard when no users exist', async () => {
      const res = await runWithTenant(tenantA, false, () =>
        leaderboardService.getLeaderboard('all', 10)
      );

      expect(res.leaderboard).toHaveLength(0);
      expect(res.userRank).toBeNull();
      expect(res.period).toBe('all');
    });

    it('should return points-based leaderboard sorted by totalPoints descending', async () => {
      // Create users with different points
      const u1 = await runWithTenant(tenantA, false, () =>
        User.create({
          name: 'Alice',
          email: 'alice@test.com',
          password: 'Password123!',
          role: 'student',
          totalPoints: 100,
          tenantId: tenantA,
        })
      );

      const u2 = await runWithTenant(tenantA, false, () =>
        User.create({
          name: 'Bob',
          email: 'bob@test.com',
          password: 'Password123!',
          role: 'student',
          totalPoints: 250,
          tenantId: tenantA,
        })
      );

      const u3 = await runWithTenant(tenantA, false, () =>
        User.create({
          name: 'Charlie',
          email: 'charlie@test.com',
          password: 'Password123!',
          role: 'student',
          totalPoints: 150,
          tenantId: tenantA,
        })
      );

      const res = await runWithTenant(tenantA, false, () =>
        leaderboardService.getLeaderboard('all', 10, u3._id.toString())
      );

      expect(res.leaderboard).toHaveLength(3);
      // Sorted Bob (250) -> Charlie (150) -> Alice (100)
      expect(res.leaderboard[0].name).toBe('Bob');
      expect(res.leaderboard[0].rank).toBe(1);
      expect(res.leaderboard[1].name).toBe('Charlie');
      expect(res.leaderboard[1].rank).toBe(2);
      expect(res.leaderboard[2].name).toBe('Alice');
      expect(res.leaderboard[2].rank).toBe(3);

      // Check current user's rank (Charlie)
      expect(res.userRank).toBe(2);
    });

    it('should enforce strict tenant isolation', async () => {
      // Tenant A User
      await runWithTenant(tenantA, false, () =>
        User.create({
          name: 'Alice',
          email: 'alice@test.com',
          password: 'Password123!',
          role: 'student',
          totalPoints: 100,
          tenantId: tenantA,
        })
      );

      // Tenant B User
      await runWithTenant(tenantB, false, () =>
        User.create({
          name: 'Bob',
          email: 'bob@test.com',
          password: 'Password123!',
          role: 'student',
          totalPoints: 200,
          tenantId: tenantB,
        })
      );

      const resA = await runWithTenant(tenantA, false, () =>
        leaderboardService.getLeaderboard('all', 10)
      );
      expect(resA.leaderboard).toHaveLength(1);
      expect(resA.leaderboard[0].name).toBe('Alice');

      const resB = await runWithTenant(tenantB, false, () =>
        leaderboardService.getLeaderboard('all', 10)
      );
      expect(resB.leaderboard).toHaveLength(1);
      expect(resB.leaderboard[0].name).toBe('Bob');
    });

    it('should cache results in Redis and return cached on subsequent calls', async () => {
      await runWithTenant(tenantA, false, () =>
        User.create({
          name: 'Alice',
          email: 'alice@test.com',
          password: 'Password123!',
          role: 'student',
          totalPoints: 100,
          tenantId: tenantA,
        })
      );

      // First call (populates cache)
      const res1 = await runWithTenant(tenantA, false, () =>
        leaderboardService.getLeaderboard('all', 10)
      );
      expect(res1.leaderboard).toHaveLength(1);

      // Create another user in DB
      await runWithTenant(tenantA, false, () =>
        User.create({
          name: 'Bob',
          email: 'bob@test.com',
          password: 'Password123!',
          role: 'student',
          totalPoints: 200,
          tenantId: tenantA,
        })
      );

      // Second call (should hit cache and only return Alice)
      const res2 = await runWithTenant(tenantA, false, () =>
        leaderboardService.getLeaderboard('all', 10)
      );
      expect(res2.leaderboard).toHaveLength(1);
      expect(res2.leaderboard[0].name).toBe('Alice');
    });
  });

  describe('getLeaderboard (period-based, score-based)', () => {
    it('should aggregate test scores for weekly/monthly leaderboards', async () => {
      // Create users
      const u1 = await runWithTenant(tenantA, false, () =>
        User.create({
          name: 'Alice',
          email: 'alice@test.com',
          password: 'Password123!',
          role: 'student',
          tenantId: tenantA,
        })
      );
      const u2 = await runWithTenant(tenantA, false, () =>
        User.create({
          name: 'Bob',
          email: 'bob@test.com',
          password: 'Password123!',
          role: 'student',
          tenantId: tenantA,
        })
      );

      // Create test attempts
      await runWithTenant(tenantA, false, () =>
        TestAttempt.create([
          {
            user: u1._id,
            test: new mongoose.Types.ObjectId(),
            status: 'completed',
            score: 80,
            percentage: 80,
            totalMarks: 100,
            tenantId: tenantA,
          },
          {
            user: u2._id,
            test: new mongoose.Types.ObjectId(),
            status: 'completed',
            score: 95,
            percentage: 95,
            totalMarks: 100,
            tenantId: tenantA,
          },
          {
            // Pending attempt, shouldn't be counted
            user: u1._id,
            test: new mongoose.Types.ObjectId(),
            status: 'in_progress',
            score: 0,
            percentage: 0,
            totalMarks: 100,
            tenantId: tenantA,
          },
        ])
      );

      const res = await runWithTenant(tenantA, false, () =>
        leaderboardService.getLeaderboard('weekly', 10)
      );

      expect(res.leaderboard).toHaveLength(2);
      expect(res.leaderboard[0].name).toBe('Bob');
      expect(res.leaderboard[0].totalScore).toBe(95);
      expect(res.leaderboard[1].name).toBe('Alice');
      expect(res.leaderboard[1].totalScore).toBe(80);
    });
  });
});
