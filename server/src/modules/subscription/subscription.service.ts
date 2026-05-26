import mongoose from 'mongoose';
import { BaseService } from '../../core/base.service.js';
import { ISubscriptionPlan, ISubscriptionPlanDto } from '../payment/payment.dto.js';
import SubscriptionPlanRepository from './subscriptionPlan.repository.js';
import Institute from '../institute/institute.model.js';
import { ApiError } from '../../core/api-error.js';
import { transactionalEmailQueue } from '../../queues/index.js';
import SubscriptionPlan from './subscriptionPlan.model.js';

export class SubscriptionService extends BaseService<
  ISubscriptionPlan,
  SubscriptionPlanRepository
> {
  constructor(repository: SubscriptionPlanRepository = new SubscriptionPlanRepository()) {
    super(repository);
  }

  async createPlan(data: ISubscriptionPlanDto): Promise<ISubscriptionPlan> {
    const existing = await SubscriptionPlan.findOne({ name: data.name.toLowerCase() });
    if (existing) {
      throw ApiError.conflict('Plan with this name already exists');
    }

    return this.repository.create({
      ...data,
      name: data.name.toLowerCase(),
    });
  }

  async getPlans(): Promise<ISubscriptionPlan[]> {
    return this.repository.find({ isActive: true });
  }

  async updatePlan(
    id: string,
    updates: Partial<ISubscriptionPlanDto>
  ): Promise<ISubscriptionPlan | null> {
    const plan = await this.repository.updateById(id, updates);
    if (!plan) {
      throw ApiError.notFound('Plan not found');
    }
    return plan;
  }

  async deletePlan(id: string): Promise<ISubscriptionPlan | null> {
    const plan = await this.repository.updateById(id, { isActive: false });
    if (!plan) {
      throw ApiError.notFound('Plan not found');
    }
    return plan;
  }

  async upgradeSubscriptionDemo(tenantId: string, planId: string) {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) throw ApiError.notFound('Plan not found');

    const institute = await Institute.findById(tenantId);
    if (!institute) throw ApiError.notFound('Institute not found');

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (plan.billingCycle === 'yearly' ? 12 : 1));

    institute.subscription.plan = plan._id;
    institute.subscription.status = 'active';
    institute.subscription.expiresAt = expiresAt;
    institute.limits.studentLimit = plan.studentLimit;
    institute.limits.teacherLimit = plan.teacherLimit;
    institute.limits.storageLimit = plan.storageLimit;
    await institute.save();

    return { institute, plan };
  }

  async getMySubscription(tenantId: string) {
    const institute = await Institute.findById(tenantId).populate('subscription.plan');
    if (!institute) throw ApiError.notFound('Institute not found');

    return {
      subscription: institute.subscription,
      limits: institute.limits,
      storageUsed: institute.storageUsed,
    };
  }

  /**
   * Dunning Engine: Audits tenant expiresAt dates.
   * Warns tenants whose subscription expired but are in the 7-day grace period.
   * Suspends tenants whose grace period has expired (> 7 days).
   */
  async runDunningCycle() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Suspend institutes that are past due by more than 7 days
    const toSuspend = await Institute.find({
      'subscription.status': 'active',
      'subscription.expiresAt': { $lt: sevenDaysAgo },
    });

    for (const inst of toSuspend) {
      inst.subscription.status = 'suspended';
      await inst.save();

      // Dispatch email notification
      await transactionalEmailQueue
        .add('send', {
          type: 'subscription_suspended',
          data: { institute: inst },
        })
        .catch(() => {});
    }

    // 2. Warn/notify institutes that are past due but still inside the grace period
    const toWarn = await Institute.find({
      'subscription.status': 'active',
      'subscription.expiresAt': { $lt: now, $gte: sevenDaysAgo },
    });

    for (const inst of toWarn) {
      await transactionalEmailQueue
        .add('send', {
          type: 'subscription_grace_period',
          data: { institute: inst },
        })
        .catch(() => {});
    }

    return { warnedCount: toWarn.length, suspendedCount: toSuspend.length };
  }
}
export default SubscriptionService;
