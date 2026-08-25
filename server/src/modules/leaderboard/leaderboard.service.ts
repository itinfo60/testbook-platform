import prisma from '../../config/prisma.js';
import redis from '../../config/redis.js';
import { getTenantId } from '../../core/tenant.context.js';
import { ILeaderboardResponse, ILeaderboardEntry } from './leaderboard.dto.js';

export class LeaderboardService {
  async getLeaderboard(
    period: 'all' | 'weekly' | 'monthly' = 'all',
    limit = 50,
    currentUserId?: string
  ): Promise<ILeaderboardResponse> {
    const tenantId = getTenantId();
    const cacheKey = tenantId
      ? `tenant:${tenantId}:leaderboard:${period}:${limit}`
      : `leaderboard:${period}:${limit}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
      const userRank = this.calculateUserRank(parsed.leaderboard, currentUserId);
      return { leaderboard: parsed.leaderboard, userRank, period };
    }

    let leaderboard: ILeaderboardEntry[] = [];

    if (period === 'all') {
      const userQuery: any = {};
      if (tenantId) {
        userQuery.tenantId = tenantId;
      }
      const users = await prisma.user.findMany({
        where: userQuery,
        orderBy: { totalPoints: 'desc' },
        take: limit,
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
        name: u.name,
        avatar: u.avatar,
        totalPoints: u.totalPoints ?? 0,
        totalScore: u.totalPoints ?? 0,
        completedCourses: u.completedCourses ?? 0,
        streak: u.streak ?? 0,
      }));
    } else {
      const dateFilter: any = {};
      const now = new Date();
      if (period === 'weekly') {
        dateFilter.createdAt = { gte: new Date(now.getTime() - 7 * 86400000) };
      } else if (period === 'monthly') {
        dateFilter.createdAt = { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
      }

      const matchStage: any = { status: 'completed', ...dateFilter };
      if (tenantId) matchStage.tenantId = tenantId;

      const results = await prisma.testAttempt.groupBy({
        by: ['userId'],
        where: matchStage,
        _sum: { score: true },
        _count: { _all: true },
        _avg: { percentage: true },
        orderBy: { _sum: { score: 'desc' } },
        take: limit,
      });

      leaderboard = results.map((entry: any, index: number) => ({
        rank: index + 1,
        _id: entry.userId?.toString() || '',
        name: entry.userId, // Normally would require fetching user
        avatar: '',
        totalPoints: entry._sum?.score ?? 0,
        totalScore: entry._sum?.score ?? 0,
        testsCompleted: entry._count?._all ?? 0,
        avgPercentage: entry._avg?.percentage ?? 0,
        completedCourses: 0,
        streak: 0,
      }));
    }

    await redis.set(cacheKey, JSON.stringify({ leaderboard }), 'EX', 300);

    const userRank = this.calculateUserRank(leaderboard, currentUserId);
    return { leaderboard, userRank: userRank as any, period };
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
