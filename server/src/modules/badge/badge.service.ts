import { BadgeRepository } from './badge.repository.js';
import { UserBadgeRepository } from './userBadge.repository.js';
import { IBadge, IUserBadge } from './badge.dto.js';
import User from '../user/user.model.js';
import { ApiError } from '../../core/api-error.js';
import { sendToUser } from '../../sockets/index.js';

export class BadgeService {
  private readonly badgeRepository: BadgeRepository;
  private readonly userBadgeRepository: UserBadgeRepository;

  constructor(
    badgeRepository = new BadgeRepository(),
    userBadgeRepository = new UserBadgeRepository()
  ) {
    this.badgeRepository = badgeRepository;
    this.userBadgeRepository = userBadgeRepository;
  }

  async getMyBadges(userId: string): Promise<{
    badges: any[];
    totalEarned: number;
    totalAvailable: number;
  }> {
    const userBadges = await this.userBadgeRepository.find({ user: userId }, null, {
      populate: 'badge',
      sort: '-earnedAt',
    });

    const allBadges = await this.badgeRepository.find({ isActive: true }, null, {
      sort: 'category name',
    });

    const earnedBadgeIds = userBadges.map((ub: any) => (ub.badge ? ub.badge._id.toString() : ''));

    const badges = allBadges.map((badge) => {
      const isEarned = earnedBadgeIds.includes(badge._id.toString());
      const ubMatch = userBadges.find(
        (ub: any) => ub.badge && ub.badge._id.toString() === badge._id.toString()
      );
      return {
        ...badge.toObject(),
        isEarned,
        earnedAt: ubMatch ? ubMatch.earnedAt : null,
      };
    });

    return {
      badges,
      totalEarned: userBadges.length,
      totalAvailable: allBadges.length,
    };
  }

  async checkAndAwardBadges(userId: string, io?: any): Promise<IBadge[]> {
    try {
      const user = await User.findById(userId);
      if (!user) return [];

      const activeBadges = await this.badgeRepository.find({ isActive: true });
      const earnedBadges = await this.userBadgeRepository.find({ user: userId });
      const earnedBadgeIds = earnedBadges.map((ub) => ub.badge.toString());

      const newBadges: IBadge[] = [];

      for (const badge of activeBadges) {
        if (earnedBadgeIds.includes(badge._id.toString())) continue;

        let isCriteriaMet = false;

        switch (badge.criteria.type) {
          case 'courses_completed':
            isCriteriaMet = (user.completedCourses || 0) >= badge.criteria.value;
            break;
          case 'tests_taken':
            isCriteriaMet = (user.totalTestsTaken || 0) >= badge.criteria.value;
            break;
          case 'points_earned':
            isCriteriaMet = (user.totalPoints || 0) >= badge.criteria.value;
            break;
          case 'streak_days':
            isCriteriaMet = (user.streak || 0) >= badge.criteria.value;
            break;
          case 'courses_enrolled':
            isCriteriaMet = (user.enrolledCourses || 0) >= badge.criteria.value;
            break;
          default:
            break;
        }

        if (isCriteriaMet) {
          await this.userBadgeRepository.create({
            user: userId,
            badge: badge._id,
            tenantId: user.tenantId,
          });

          // Award points to the user
          await User.findByIdAndUpdate(userId, { $inc: { totalPoints: badge.points } });

          newBadges.push(badge);

          // Emit real-time Socket.IO notification if io is present
          if (io) {
            sendToUser(io, userId, 'badge_earned', {
              badge: {
                name: badge.name,
                icon: badge.icon,
                rarity: badge.rarity,
                points: badge.points,
              },
            });
          }
        }
      }

      return newBadges;
    } catch (error) {
      console.error('Badge check error:', error);
      return [];
    }
  }

  // Admin template CRUD
  async getAllBadges(): Promise<IBadge[]> {
    return this.badgeRepository.find({}, null, { sort: 'category name' });
  }

  async createBadge(body: any): Promise<IBadge> {
    return this.badgeRepository.create(body);
  }

  async updateBadge(id: string, body: any): Promise<IBadge> {
    const badge = await this.badgeRepository.updateById(id, body, { runValidators: true });
    if (!badge) {
      throw ApiError.notFound('Badge not found');
    }
    return badge;
  }

  async deleteBadge(id: string): Promise<void> {
    const badge = await this.badgeRepository.deleteById(id);
    if (!badge) {
      throw ApiError.notFound('Badge not found');
    }

    // Delete user earned records for this badge
    await this.userBadgeRepository.deleteMany({ badge: id });
  }
}

export default BadgeService;
