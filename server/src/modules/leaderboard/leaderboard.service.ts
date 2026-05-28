import TestAttempt from '../test/testAttempt.model.js';
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

    // Date filter for period
    const dateFilter: any = {};
    const now = new Date();
    if (period === 'weekly') {
      dateFilter.createdAt = { $gte: new Date(now.getTime() - 7 * 86400000) };
    } else if (period === 'monthly') {
      dateFilter.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    }

    // Build match stage — always filter by tenant if available
    const matchStage: any = { status: 'completed', ...dateFilter };
    if (tenantId) matchStage.tenantId = tenantId;

    const results = await TestAttempt.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$user',
          totalPoints: { $sum: '$score' },
          testsCompleted: { $sum: 1 },
          avgPercentage: { $avg: '$percentage' },
        },
      },
      { $sort: { totalPoints: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: { 'user.isActive': true } },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          avatar: '$user.avatar',
          totalPoints: 1,
          testsCompleted: 1,
          avgPercentage: { $round: ['$avgPercentage', 1] },
          completedCourses: '$user.completedCourses',
          streak: '$user.streak',
        },
      },
    ]);

    const leaderboard: ILeaderboardEntry[] = results.map((entry, index) => ({
      rank: index + 1,
      _id: entry._id.toString(),
      name: entry.name,
      avatar: entry.avatar,
      totalPoints: entry.totalPoints ?? 0,
      testsCompleted: entry.testsCompleted ?? 0,
      avgPercentage: entry.avgPercentage ?? 0,
      completedCourses: entry.completedCourses ?? 0,
      streak: entry.streak ?? 0,
    }));

    await redis.set(cacheKey, { leaderboard }, 300);

    const userRank = this.calculateUserRank(leaderboard, currentUserId);
    return { leaderboard, userRank, period };
  }

  private calculateUserRank(
    leaderboard: ILeaderboardEntry[],
    userId?: string
  ): { rank: number; points: number } | null {
    if (!userId) return null;
    const entry = leaderboard.find((e) => e._id === userId);
    if (!entry) return null;
    return { rank: entry.rank, points: entry.totalPoints ?? 0 };
  }
}

export default LeaderboardService;
