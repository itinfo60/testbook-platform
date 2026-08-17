import { Model } from 'mongoose';
import { TenantRepository } from '../../core/tenant.repository.js';
import { IUser } from '../auth/auth.dto.js';
import User from './user.model.js';
import { UserQueryInput } from './user.validation.js';

export class UserRepository extends TenantRepository<IUser> {
  constructor(model: Model<IUser> = User as Model<IUser>) {
    super(model);
  }

  async paginateUsers(query: UserQueryInput): Promise<{ docs: IUser[]; total: number }> {
    const filter: any = {};

    if (query.role) {
      filter.role = query.role;
    }

    // Default to active users only; allow explicit override to show inactive
    filter.isActive = query.isActive !== undefined ? query.isActive : true;

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    const scopedFilter = this.getScopedFilter(filter);
    const skip = (query.page - 1) * query.limit;

    const [docs, total] = await Promise.all([
      this.model.find(scopedFilter).skip(skip).limit(query.limit).sort({ createdAt: -1 }).exec(),
      this.model.countDocuments(scopedFilter).exec(),
    ]);

    return { docs, total };
  }
}
export default UserRepository;
