import User from '../user/user.model.js';
import TestAttempt from '../test/testAttempt.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import redis from '../../config/redis.js';

export const getLeaderboard = catchAsync(async (req, res) => {
  const { period = 'all', limit = 50 } = req.query;

  const cacheKey = `leaderboard:${period}:${limit}`;
  const cached = await redis.get(cacheKey);
  if (cached) return ApiResponse.ok(res, cached);

  let dateFilter = {};
  const now = new Date();

  if (period === 'weekly') {
    dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 86400000) } };
  } else if (period === 'monthly') {
    dateFilter = { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
  }

  let leaderboard;

  if (period === 'all') {
    leaderboard = await User.find({ isActive: true, totalPoints: { $gt: 0 } })
      .select('name avatar totalPoints completedCourses totalTestsTaken streak')
      .sort('-totalPoints')
      .limit(parseInt(limit))
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
      { $limit: parseInt(limit) },
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

    leaderboard = results;
  }

  // Add rank
  leaderboard = leaderboard.map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));

  // Get current user's rank
  let userRank = null;
  if (req.user) {
    const userIndex = leaderboard.findIndex(
      (e) => (e._id?.toString() || e.id) === req.userId
    );
    userRank = userIndex !== -1 ? userIndex + 1 : null;
  }

  const data = { leaderboard, userRank, period };

  await redis.set(cacheKey, data, 300); // 5 min cache

  ApiResponse.ok(res, data);
});
