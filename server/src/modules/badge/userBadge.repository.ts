import { TenantRepository } from '../../core/tenant.repository.js';
import prisma from '../../config/prisma.js';

export class UserBadgeRepository extends TenantRepository<any> {
  constructor(model = prisma.userBadge) {
    super(model as any);
  }

  async paginateUserBadges(
    filter: any,
    options: any
  ): Promise<{ docs: any[]; total: number; pagination: any }> {
    const scopedFilter = this.getScopedFilter(filter);

    // We will do a manual prisma pagination since we don't have mongoose-paginate-v2
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      prisma.userBadge.findMany({
        where: scopedFilter,
        skip,
        take: limit,
        include: { badgeObj: true }, // Assuming relation name
      }),
      prisma.userBadge.count({ where: scopedFilter }),
    ]);

    return {
      docs,
      total,
      pagination: {
        total,
        limit,
        page,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

export default UserBadgeRepository;
