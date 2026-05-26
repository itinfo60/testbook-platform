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

// Mock sockets
const mockSendToUser = vi.fn();
vi.mock('../../../src/sockets/index.js', () => ({
  sendToUser: (io: any, userId: string, event: string, data: any) =>
    mockSendToUser(userId, event, data),
}));

import { BadgeService } from '../../../src/modules/badge/badge.service.js';
import Badge from '../../../src/modules/badge/badge.model.js';
import UserBadge from '../../../src/modules/badge/userBadge.model.js';
import User from '../../../src/modules/user/user.model.js';
import redis from '../../../src/config/redis.js';
import { runWithTenant } from '../../../src/core/tenant.context.js';

describe('BadgeService', () => {
  let badgeService: BadgeService;
  const mockTenantId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    badgeService = new BadgeService();
    try {
      await Badge.collection.dropIndex('slug_1');
    } catch (e) {
      // ignore
    }
    await Badge.deleteMany({});
    await UserBadge.deleteMany({});
    await User.deleteMany({});
    await redis.flush();
    vi.clearAllMocks();
  });

  describe('createBadge', () => {
    it('should create a badge template successfully with auto slug', async () => {
      const badge = await badgeService.createBadge({
        name: 'First Completion',
        description: 'Complete your first course successfully',
        icon: 'gold_star.png',
        category: 'learning',
        criteria: { type: 'courses_completed', value: 1 },
        points: 50,
        rarity: 'common',
      });

      expect(badge.name).toBe('First Completion');
      expect(badge.slug).toBe('first-completion');
      expect(badge.criteria.type).toBe('courses_completed');
    });
  });

  describe('checkAndAwardBadges', () => {
    it('should award badge and points when student completes courses criteria', async () => {
      const badge = await badgeService.createBadge({
        name: 'Course Master',
        description: 'Complete 3 courses',
        icon: 'trophy.png',
        category: 'learning',
        criteria: { type: 'courses_completed', value: 3 },
        points: 100,
        rarity: 'rare',
      });

      const user = await runWithTenant(mockTenantId, false, () =>
        User.create({
          name: 'John Student',
          email: 'john@student.com',
          password: 'Password123!',
          role: 'student',
          completedCourses: 3, // Meets criteria
          totalPoints: 20,
          tenantId: mockTenantId,
        })
      );

      const awarded = await runWithTenant(mockTenantId, false, () =>
        badgeService.checkAndAwardBadges(user._id.toString(), {} as any)
      );

      expect(awarded).toHaveLength(1);
      expect(awarded[0].name).toBe('Course Master');

      // Check UserBadge is created
      const earned = await runWithTenant(mockTenantId, false, () =>
        UserBadge.findOne({ user: user._id, badge: badge._id })
      );
      expect(earned).toBeDefined();

      // Check User points are updated (20 + 100 = 120)
      const updatedUser = await runWithTenant(mockTenantId, false, () => User.findById(user._id));
      expect(updatedUser!.totalPoints).toBe(120);

      // Check socket was called
      expect(mockSendToUser).toHaveBeenCalledWith(
        user._id.toString(),
        'badge_earned',
        expect.objectContaining({
          badge: expect.objectContaining({
            name: 'Course Master',
            points: 100,
          }),
        })
      );
    });

    it('should not award badge if user does not meet criteria or has already earned it', async () => {
      const badge = await badgeService.createBadge({
        name: 'Streak King',
        description: 'Maintain a 5-day streak',
        icon: 'fire.png',
        category: 'streak',
        criteria: { type: 'streak_days', value: 5 },
        points: 200,
        rarity: 'epic',
      });

      const user = await runWithTenant(mockTenantId, false, () =>
        User.create({
          name: 'John Student',
          email: 'john@student.com',
          password: 'Password123!',
          role: 'student',
          streak: 4, // Below criteria (5)
          tenantId: mockTenantId,
        })
      );

      // Check 1: Criteria not met -> no award
      const awarded1 = await runWithTenant(mockTenantId, false, () =>
        badgeService.checkAndAwardBadges(user._id.toString())
      );
      expect(awarded1).toHaveLength(0);

      // Meet criteria
      await runWithTenant(mockTenantId, false, () =>
        User.findByIdAndUpdate(user._id, { streak: 5 })
      );

      // Check 2: Criteria met -> award
      const awarded2 = await runWithTenant(mockTenantId, false, () =>
        badgeService.checkAndAwardBadges(user._id.toString())
      );
      expect(awarded2).toHaveLength(1);

      // Check 3: Already earned -> no duplicate award
      const awarded3 = await runWithTenant(mockTenantId, false, () =>
        badgeService.checkAndAwardBadges(user._id.toString())
      );
      expect(awarded3).toHaveLength(0);
    });
  });

  describe('getMyBadges', () => {
    it('should return all active badges mapped with earned statuses', async () => {
      const b1 = await badgeService.createBadge({
        name: 'Badge A',
        description: 'Desc A',
        icon: 'a.png',
        category: 'learning',
        criteria: { type: 'courses_completed', value: 1 },
        points: 10,
        isActive: true,
      });

      const b2 = await badgeService.createBadge({
        name: 'Badge B',
        description: 'Desc B',
        icon: 'b.png',
        category: 'learning',
        criteria: { type: 'courses_completed', value: 2 },
        points: 20,
        isActive: true,
      });

      const user = await runWithTenant(mockTenantId, false, () =>
        User.create({
          name: 'John Student',
          email: 'john@student.com',
          password: 'Password123!',
          role: 'student',
          tenantId: mockTenantId,
        })
      );

      // Earn Badge A
      await runWithTenant(mockTenantId, false, () =>
        UserBadge.create({
          user: user._id,
          badge: b1._id,
          tenantId: mockTenantId,
        })
      );

      const myBadgesResult = await runWithTenant(mockTenantId, false, () =>
        badgeService.getMyBadges(user._id.toString())
      );

      expect(myBadgesResult.totalAvailable).toBe(2);
      expect(myBadgesResult.totalEarned).toBe(1);

      const mappedA = myBadgesResult.badges.find((b) => b.name === 'Badge A');
      expect(mappedA.isEarned).toBe(true);
      expect(mappedA.earnedAt).toBeDefined();

      const mappedB = myBadgesResult.badges.find((b) => b.name === 'Badge B');
      expect(mappedB.isEarned).toBe(false);
      expect(mappedB.earnedAt).toBeNull();
    });
  });
});
