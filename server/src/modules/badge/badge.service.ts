import { BadgeRepository } from './badge.repository.js';
import { UserBadgeRepository } from './userBadge.repository.js';
import { ApiError } from '../../core/api-error.js';
import { sendToUser } from '../../sockets/index.js';
import prisma from '../../config/prisma.js';

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
    // Note: populate depends on Prisma includes now, but base repo might not support it fully.
    // Using Prisma client directly is safer.
    const userBadges = await prisma.userBadge.findMany({
      where: { user: userId },
      include: { badgeObj: true },
      orderBy: { earnedAt: 'desc' },
    });

    const allBadges = await prisma.badge.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const earnedBadgeIds = userBadges.map((ub: any) => (ub.badge ? ub.badge : ''));

    const badges = allBadges.map((badge) => {
      const isEarned = earnedBadgeIds.includes(badge.id);
      const ubMatch = userBadges.find((ub: any) => ub.badge && ub.badge === badge.id);
      return {
        ...badge,
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

  async checkAndAwardBadges(userId: string, io?: any): Promise<any[]> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return [];

      const activeBadges = await prisma.badge.findMany({ where: { isActive: true } });
      const earnedBadges = await prisma.userBadge.findMany({ where: { user: userId } });
      const earnedBadgeIds = earnedBadges.map((ub) => ub.badge);

      const newBadges: any[] = [];

      for (const badge of activeBadges) {
        if (earnedBadgeIds.includes(badge.id)) continue;

        let isCriteriaMet = false;

        const criteria: any =
          typeof badge.criteria === 'string' ? JSON.parse(badge.criteria) : badge.criteria;
        const cType = criteria.type;
        const cValue = criteria.value;

        switch (cType) {
          case 'courses_completed':
            isCriteriaMet = (user.completedCourses || 0) >= cValue;
            break;
          case 'tests_taken':
            isCriteriaMet = (user.totalTestsTaken || 0) >= cValue;
            break;
          case 'points_earned':
            isCriteriaMet = (user.totalPoints || 0) >= cValue;
            break;
          case 'streak_days':
            isCriteriaMet = (user.streak || 0) >= cValue;
            break;
          case 'courses_enrolled':
            isCriteriaMet = (user.enrolledCourses || 0) >= cValue;
            break;
          default:
            break;
        }

        if (isCriteriaMet) {
          await prisma.userBadge.create({
            data: {
              user: userId,
              badge: badge.id,
              tenantId: user.tenantId as string,
            },
          });

          await prisma.user.update({
            where: { id: userId },
            data: { totalPoints: { increment: badge.points } },
          });

          newBadges.push(badge);

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

  async getAllBadges(): Promise<any[]> {
    return prisma.badge.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
  }

  async createBadge(body: any): Promise<any> {
    return prisma.badge.create({ data: body });
  }

  async updateBadge(id: string, body: any): Promise<any> {
    const badge = await prisma.badge.update({ where: { id }, data: body }).catch(() => null);
    if (!badge) {
      throw ApiError.notFound('Badge not found');
    }
    return badge;
  }

  async deleteBadge(id: string): Promise<void> {
    const badge = await prisma.badge.delete({ where: { id } }).catch(() => null);
    if (!badge) {
      throw ApiError.notFound('Badge not found');
    }

    await prisma.userBadge.deleteMany({ where: { badge: id } });
  }
}

export default BadgeService;
