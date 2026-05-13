import Badge from './badge.model.js';
import UserBadge from './userBadge.model.js';
import User from '../user/user.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import catchAsync from '../../utils/catchAsync.js';
import { sendToUser } from '../../sockets/index.js';

export const getMyBadges = catchAsync(async (req, res) => {
  const userBadges = await UserBadge.find({ user: req.userId })
    .populate('badge')
    .sort('-earnedAt')
    .lean();

  const allBadges = await Badge.find({ isActive: true }).lean();

  const earnedBadgeIds = userBadges.map((ub) => ub.badge._id.toString());

  const badges = allBadges.map((badge) => ({
    ...badge,
    isEarned: earnedBadgeIds.includes(badge._id.toString()),
    earnedAt: userBadges.find((ub) => ub.badge._id.toString() === badge._id.toString())?.earnedAt,
  }));

  ApiResponse.ok(res, {
    badges,
    totalEarned: userBadges.length,
    totalAvailable: allBadges.length,
  });
});

export const checkAndAwardBadges = async (userId, io) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const badges = await Badge.find({ isActive: true }).lean();
    const earnedBadges = await UserBadge.find({ user: userId }).distinct('badge');
    const earnedBadgeIds = earnedBadges.map((id) => id.toString());

    const newBadges = [];

    for (const badge of badges) {
      if (earnedBadgeIds.includes(badge._id.toString())) continue;

      let earned = false;

      switch (badge.criteria.type) {
        case 'courses_completed':
          earned = user.completedCourses >= badge.criteria.value;
          break;
        case 'tests_taken':
          earned = user.totalTestsTaken >= badge.criteria.value;
          break;
        case 'points_earned':
          earned = user.totalPoints >= badge.criteria.value;
          break;
        case 'streak_days':
          earned = user.streak >= badge.criteria.value;
          break;
        case 'courses_enrolled':
          earned = user.enrolledCourses >= badge.criteria.value;
          break;
        default:
          break;
      }

      if (earned) {
        await UserBadge.create({ user: userId, badge: badge._id });
        await User.findByIdAndUpdate(userId, { $inc: { totalPoints: badge.points } });
        newBadges.push(badge);

        // Real-time notification
        if (io) {
          sendToUser(io, userId, 'badge_earned', {
            badge: { name: badge.name, icon: badge.icon, rarity: badge.rarity, points: badge.points },
          });
        }
      }
    }

    return newBadges;
  } catch (error) {
    console.error('Badge check error:', error);
    return [];
  }
};

// Admin
export const getAllBadges = catchAsync(async (req, res) => {
  const badges = await Badge.find().sort('category name').lean();
  ApiResponse.ok(res, { badges });
});

export const createBadge = catchAsync(async (req, res) => {
  const badge = await Badge.create(req.body);
  ApiResponse.created(res, { badge }, 'Badge created');
});

export const updateBadge = catchAsync(async (req, res) => {
  const badge = await Badge.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!badge) throw ApiError.notFound('Badge not found');
  ApiResponse.ok(res, { badge }, 'Badge updated');
});

export const deleteBadge = catchAsync(async (req, res) => {
  await Badge.findByIdAndDelete(req.params.id);
  await UserBadge.deleteMany({ badge: req.params.id });
  ApiResponse.ok(res, null, 'Badge deleted');
});
