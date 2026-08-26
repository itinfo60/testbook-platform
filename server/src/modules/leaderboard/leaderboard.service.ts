import prisma from '../../config/prisma.js';
import redis from '../../config/redis.js';
import { getTenantId } from '../../core/tenant.context.js';
import { ILeaderboardResponse, ILeaderboardEntry } from './leaderboard.dto.js';

export class LeaderboardService {
  async getLeaderboard(
    period: 'all' | 'weekly' | 'monthly' | 'allTime' = 'all',
    limit = 10,
    currentUserId?: string
  ): Promise<ILeaderboardResponse> {
    const normalizedPeriod = period === 'allTime' ? 'all' : period;
    const effectiveLimit = Math.min(10, Math.max(1, limit || 10));

    const tenantId = getTenantId();
    const cacheKey = tenantId
      ? `tenant:${tenantId}:leaderboard:${normalizedPeriod}:${effectiveLimit}`
      : `leaderboard:${normalizedPeriod}:${effectiveLimit}`;

    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) {
      try {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
        const userRank = this.calculateUserRank(parsed.leaderboard, currentUserId);
        return {
          leaderboard: (parsed.leaderboard || []).slice(0, 10),
          userRank,
          period: normalizedPeriod,
        };
      } catch (e) {}
    }

    let leaderboard: ILeaderboardEntry[] = [];

    if (normalizedPeriod === 'all') {
      const userQuery: any = {
        role: 'student',
      };
      if (tenantId) {
        userQuery.tenantId = tenantId;
      }
      const users = await prisma.user.findMany({
        where: userQuery,
        orderBy: { totalPoints: 'desc' },
        take: effectiveLimit,
        select: {
          id: true,
          name: true,
          avatar: true,
          totalPoints: true,
          completedCourses: true,
          streak: true,
        },
      });

      leaderboard = users.map((u: any, index: number) => ({
        rank: index + 1,
        _id: u.id.toString(),
        name: u.name || 'Anonymous Learner',
        avatar: u.avatar || '',
        totalPoints: u.totalPoints ?? 0,
        totalScore: u.totalPoints ?? 0,
        completedCourses: u.completedCourses ?? 0,
        streak: u.streak ?? 0,
      }));
    } else {
      const dateFilter: any = {};
      const now = new Date();
      if (normalizedPeriod === 'weekly') {
        dateFilter.startedAt = { gte: new Date(now.getTime() - 7 * 86400000) };
      } else if (normalizedPeriod === 'monthly') {
        dateFilter.startedAt = { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
      }

      const matchStage: any = { ...dateFilter };
      if (tenantId) matchStage.tenantId = tenantId;

      const results = await prisma.testAttempt.groupBy({
        by: ['userId'],
        where: matchStage,
        _sum: { score: true },
        _count: { _all: true },
        _avg: { percentage: true },
        orderBy: { _sum: { score: 'desc' } },
        take: effectiveLimit,
      });

      const userIds = results.map((r: any) => r.userId).filter(Boolean);
      const users =
        userIds.length > 0
          ? await prisma.user.findMany({
              where: { id: { in: userIds } },
              select: { id: true, name: true, avatar: true },
            })
          : [];
      const userMap = new Map(users.map((u) => [u.id, u]));

      leaderboard = results.map((entry: any, index: number) => {
        const user = userMap.get(entry.userId);
        return {
          rank: index + 1,
          _id: entry.userId?.toString() || '',
          name: user?.name || 'Anonymous Learner',
          avatar: user?.avatar || '',
          totalPoints: Math.round(entry._sum?.score ?? 0),
          totalScore: Math.round(entry._sum?.score ?? 0),
          testsCompleted: entry._count?._all ?? 0,
          avgPercentage: Math.round(entry._avg?.percentage ?? 0),
          completedCourses: 0,
          streak: 0,
        };
      });
    }

    await redis.set(cacheKey, JSON.stringify({ leaderboard }), 'EX', 300).catch(() => {});

    const userRank = this.calculateUserRank(leaderboard, currentUserId);
    return {
      leaderboard: leaderboard.slice(0, 10),
      userRank: userRank as any,
      period: normalizedPeriod,
    };
  }

  private calculateUserRank(
    leaderboard: ILeaderboardEntry[],
    userId?: string
  ): { rank: number; points: number } | null {
    if (!userId) return null;
    const entry = leaderboard.find((e) => (e as any)._id === userId || (e as any).id === userId);
    if (!entry) return null;
    return {
      rank: entry.rank,
      points: (entry as any).totalPoints ?? (entry as any).totalScore ?? 0,
    };
  }
}

export default LeaderboardService;
