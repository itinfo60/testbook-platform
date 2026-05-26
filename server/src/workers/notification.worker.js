import { Worker } from 'bullmq';
import Notification from '../modules/notification/notification.model.js';
import User from '../modules/user/user.model.js';
import { sendMulticastPush } from '../utils/pushNotification.js';
import logger from '../utils/logger.js';
import { queueConnection } from '../queues/index.js';
import { runWithTenant } from '../utils/TenantContext.js';

const notificationWorker = new Worker(
  'notification',
  async (job) => {
    const { type, userId, tenantId, title, message, data } = job.data;
    logger.info(`Processing notification job [${job.id}] type=${type}`);

    await runWithTenant(tenantId, false, async () => {
      // Save in-app notification
      await Notification.create({ user: userId, tenantId, type, title, message, data: data || {} });

      // Send FCM push if user has tokens
      const user = await User.findById(userId).select('fcmTokens');
      if (user?.fcmTokens?.length) {
        await sendMulticastPush({ tokens: user.fcmTokens, title, body: message, data });
      }
    });
  },
  {
    connection: queueConnection,
    concurrency: 10,
  }
);

notificationWorker.on('completed', (job) => {
  logger.info(`Notification job [${job.id}] completed`);
});

notificationWorker.on('failed', (job, err) => {
  logger.error(`Notification job [${job?.id}] failed: ${err.message}`);
});

export default notificationWorker;
