import User from '../user/user.model.js';
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

    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      // If we have a cached leaderboard, we still need to compute userRank dynamically
      // because currentUserId can change from request to request.
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
      const userRank = this.calculateUserRank(parsed.leaderboard, currentUserId);
      return {
        leaderboard: parsed.leaderboard,
        userRank,
        period,
      };
    }

    let dateFilter: any = {};
    const now = new Date();

    if (period === 'weekly') {
      dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 86400000) } };
    } else if (period === 'monthly') {
      dateFilter = { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
    }

    let rawLeaderboard: any[] = [];

    if (period === 'all') {
      rawLeaderboard = await User.find({ isActive: true, totalPoints: { $gt: 0 } })
        .select('name avatar totalPoints completedCourses totalTestsTaken streak')
        .sort('-totalPoints')
        .limit(limit)
        .lean();
    } else {
      // Period-based leaderboard from test attempts
      const results = await TestAttempt.aggregate([
        { $match: { status: 'completed', ...dateFilter } },
        {
          $group: {
            _id: '$user',
            totalScore: { $sum: '$score' },
            testsCompleted: { $sum: 1 },
            avgPercentage: { $avg: '$percentage' },
          },
        },
        { $sort: { totalScore: -1 } },
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
        {
          $project: {
            _id: 1,
            name: '$user.name',
            avatar: '$user.avatar',
            totalScore: 1,
            testsCompleted: 1,
            avgPercentage: { $round: ['$avgPercentage', 1] },
          },
        },
      ]);
      rawLeaderboard = results;
    }

    // Add rank
    const leaderboard: ILeaderboardEntry[] = rawLeaderboard.map((entry, index) => ({
      rank: index + 1,
      _id: entry._id.toString(),
      name: entry.name,
      avatar: entry.avatar,
      totalPoints: entry.totalPoints,
      completedCourses: entry.completedCourses,
      totalTestsTaken: entry.totalTestsTaken,
      streak: entry.streak,
      totalScore: entry.totalScore,
      testsCompleted: entry.testsCompleted,
      avgPercentage: entry.avgPercentage,
    }));

    // Cache the leaderboard (expires in 5 minutes)
    await redis.set(cacheKey, { leaderboard }, 300);

    const userRank = this.calculateUserRank(leaderboard, currentUserId);

    return {
      leaderboard,
      userRank,
      period,
    };
  }

  private calculateUserRank(leaderboard: ILeaderboardEntry[], userId?: string): number | null {
    if (!userId) return null;
    const userIndex = leaderboard.findIndex((e) => e._id === userId);
    return userIndex !== -1 ? userIndex + 1 : null;
  }
}

export default LeaderboardService;
