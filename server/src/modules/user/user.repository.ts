import { TenantRepository } from '../../core/tenant.repository.js';
import { IUser } from '../auth/auth.dto.js';
import prisma from '../../config/prisma.js';
import { UserQueryInput } from './user.validation.js';

export class UserRepository extends TenantRepository<IUser> {
  constructor(model = prisma.user) {
    super(model as any);
  }

  async paginateUsers(query: UserQueryInput): Promise<{ docs: IUser[]; total: number }> {
    const filter: any = {};

    if (query.role) {
      filter.role = query.role;
    }

    // Default to active users only; allow explicit override to show inactive
    filter.isActive = query.isActive !== undefined ? query.isActive : true;

    if (query.search) {
      filter.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const scopedFilter = this.getScopedFilter(filter);
    const skip = (query.page - 1) * query.limit;

    const [docs, total] = await Promise.all([
      this.model.findMany({
        where: scopedFilter,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.model.count({ where: scopedFilter }),
    ]);

    return { docs, total };
  }
}
export default UserRepository;
