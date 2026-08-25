import { BaseRepository } from '../../core/base.repository.js';
import prisma from '../../config/prisma.js';

export class SubscriptionPlanRepository extends BaseRepository<any> {
  constructor(model = prisma.subscriptionPlan) {
    super(model as any);
  }
}
export default SubscriptionPlanRepository;
