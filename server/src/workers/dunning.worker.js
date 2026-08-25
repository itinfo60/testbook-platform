import { Worker } from 'bullmq';
import prisma from '../config/prisma.js';
import { transactionalEmailQueue } from '../queues/index.js';
import { queueConnection } from '../queues/index.js';
import { runWithTenant } from '../utils/TenantContext.js';
import logger from '../utils/logger.js';

/**
 * Dunning worker: runs on a schedule (daily) to send expiry reminders.
 * Job types:
 *   - check_expiring: find institutes expiring in 3/7/14 days and queue reminder emails
 *   - check_expired: find expired institutes and send final notice
 */
const dunningWorker = new Worker(
  'dunning',
  async (job) => {
    const { type } = job.data;

    if (type === 'check_expiring') {
      const now = new Date();

      // Find institutes expiring in 3, 7, or 14 days
      const thresholds = [3, 7, 14];

      for (const days of thresholds) {
        const windowStart = new Date(now.getTime() + days * 24 * 60 * 60 * 1000 - 60 * 60 * 1000);
        const windowEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000 + 60 * 60 * 1000);

        const expiring = await runWithTenant(null, true, () =>
          prisma.institute.findMany({
            where: {
              subscriptionStatus: 'active',
              subscriptionExpiresAt: { gte: windowStart, lte: windowEnd },
            },
          })
        );

        for (const institute of expiring) {
          const admin = await runWithTenant(null, true, () =>
            prisma.user.findFirst({ where: { tenantId: institute.id, role: 'admin' } })
          );
          if (!admin) continue;

          await transactionalEmailQueue.add('send', {
            type: 'subscription_expiry_warning',
            data: {
              user: admin,
              institute,
              daysLeft: days,
              expiresAt: institute.subscriptionExpiresAt,
            },
          });

          logger.info(`Dunning: sent ${days}-day warning to ${institute.subdomain}`);
        }
      }
    } else if (type === 'check_expired') {
      const gracePeriodEnd = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const expired = await runWithTenant(null, true, () =>
        prisma.institute.findMany({
          where: {
            subscriptionStatus: 'active',
            subscriptionExpiresAt: { lt: gracePeriodEnd },
          },
        })
      );

      for (const institute of expired) {
        await runWithTenant(null, true, () =>
          prisma.institute.update({
            where: { id: institute.id },
            data: { subscriptionStatus: 'expired' },
          })
        );

        const admin = await runWithTenant(null, true, () =>
          prisma.user.findFirst({ where: { tenantId: institute.id, role: 'admin' } })
        );
        if (admin) {
          await transactionalEmailQueue.add('send', {
            type: 'subscription_expired',
            data: { user: admin, institute },
          });
        }

        logger.info(`Dunning: marked ${institute.subdomain} as expired`);
      }
    }
  },
  { connection: queueConnection, concurrency: 1 }
);

dunningWorker.on('failed', (job, err) => {
  logger.error(`Dunning job [${job?.id}] failed: ${err.message}`);
});

export default dunningWorker;
