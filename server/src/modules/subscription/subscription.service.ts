import prisma from '../../config/prisma.js';
import { BaseService } from '../../core/base.service.js';
import { ISubscriptionPlan, ISubscriptionPlanDto } from '../payment/payment.dto.js';
import SubscriptionPlanRepository from './subscriptionPlan.repository.js';
import { ApiError } from '../../core/api-error.js';
import { transactionalEmailQueue } from '../../queues/index.js';

export class SubscriptionService extends BaseService<any, SubscriptionPlanRepository> {
  constructor(repository: SubscriptionPlanRepository = new SubscriptionPlanRepository()) {
    super(repository);
  }

  async createPlan(data: ISubscriptionPlanDto): Promise<any> {
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { name: data.name.toLowerCase() },
    });
    if (existing) {
      throw ApiError.conflict('Plan with this name already exists');
    }

    return prisma.subscriptionPlan.create({
      data: {
        ...data,
        name: data.name.toLowerCase(),
      } as any,
    });
  }

  async getPlans(): Promise<any[]> {
    return prisma.subscriptionPlan.findMany({ where: { isActive: true } });
  }

  async updatePlan(id: string, updates: Partial<ISubscriptionPlanDto>): Promise<any | null> {
    const plan = await prisma.subscriptionPlan
      .update({ where: { id }, data: updates as any })
      .catch(() => null);
    if (!plan) {
      throw ApiError.notFound('Plan not found');
    }
    return plan;
  }

  async deletePlan(id: string): Promise<any | null> {
    const plan = await prisma.subscriptionPlan
      .update({ where: { id }, data: { isActive: false } })
      .catch(() => null);
    if (!plan) {
      throw ApiError.notFound('Plan not found');
    }
    return plan;
  }

  async upgradeSubscriptionDemo(tenantId: string, planId: string) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) throw ApiError.notFound('Plan not found');

    const institute = await prisma.institute.findUnique({ where: { id: tenantId } });
    if (!institute) throw ApiError.notFound('Institute not found');

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (plan.billingCycle === 'yearly' ? 12 : 1));

    const updatedInstitute = await prisma.institute.update({
      where: { id: tenantId },
      data: {
        subscription: {
          plan: plan.id,
          status: 'active',
          expiresAt,
        },
        limits: {
          studentLimit: plan.studentLimit,
          teacherLimit: plan.teacherLimit,
          storageLimit: plan.storageLimit,
        },
      },
    });

    return { institute: updatedInstitute, plan };
  }

  async getMySubscription(tenantId: string) {
    // Note: Assuming subscription JSON or relations. If it's a relation, include it.
    // If it's JSON, the plan ID is inside subscription. We'll return as is or fetch plan if needed.
    const institute = await prisma.institute.findUnique({ where: { id: tenantId } });
    if (!institute) throw ApiError.notFound('Institute not found');

    let planData = null;
    if (institute.subscription && (institute.subscription as any).plan) {
      planData = await prisma.subscriptionPlan.findUnique({
        where: { id: (institute.subscription as any).plan },
      });
    }

    return {
      subscription: { ...((institute.subscription as any) || {}), plan: planData },
      limits: institute.limits,
      storageUsed: institute.storageUsed,
    };
  }

  async runDunningCycle() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Prisma doesn't natively query JSON properties efficiently across all dbs for `$lt`, so we might need a raw query or iterate.
    // Given the small size, we can fetch all active, then filter. Or use a native JSON query if Postgres.
    // Assuming Postgres raw query for the JSON fields.
    const toSuspend = await prisma.$queryRaw<any[]>`
      SELECT * FROM "Institute"
      WHERE "subscription"->>'status' = 'active'
        AND ("subscription"->>'expiresAt')::timestamp < ${sevenDaysAgo}
    `;

    for (const inst of toSuspend) {
      await prisma.institute.update({
        where: { id: inst.id },
        data: { subscription: { ...inst.subscription, status: 'suspended' } },
      });

      await transactionalEmailQueue
        .add('send', {
          type: 'subscription_suspended',
          data: { institute: inst },
        })
        .catch(() => {});
    }

    const toWarn = await prisma.$queryRaw<any[]>`
      SELECT * FROM "Institute"
      WHERE "subscription"->>'status' = 'active'
        AND ("subscription"->>'expiresAt')::timestamp < ${now}
        AND ("subscription"->>'expiresAt')::timestamp >= ${sevenDaysAgo}
    `;

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
