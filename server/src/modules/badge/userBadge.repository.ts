import { Model } from 'mongoose';
import { TenantRepository } from '../../core/tenant.repository.js';
import { IUserBadge } from './badge.dto.js';
import UserBadge from './userBadge.model.js';

export class UserBadgeRepository extends TenantRepository<IUserBadge> {
  constructor(model: Model<IUserBadge> = UserBadge) {
    super(model);
  }

  async paginateUserBadges(
    filter: any,
    options: any
  ): Promise<{ docs: IUserBadge[]; total: number; pagination: any }> {
    const scopedFilter = this.getScopedFilter(filter);
    const result = await (this.model as any).paginate(scopedFilter, options);
    return {
      docs: result.docs,
      total: result.pagination.total,
      pagination: result.pagination,
    };
  }
}

export default UserBadgeRepository;
