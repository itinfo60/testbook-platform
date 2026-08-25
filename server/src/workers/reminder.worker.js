import { Worker } from 'bullmq';
import { queueConnection } from '../queues/index.js';
import { notificationQueue, transactionalEmailQueue } from '../queues/index.js';
import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';
import { sendLiveClassReminder } from '../utils/whatsapp.js';

export const reminderWorker = new Worker(
  'reminder',
  async (job) => {
    const {
      type,
      liveClassId,
      title,
      message,
      targetRoles,
      scheduledAt,
      tenantId,
      courseId,
      link,
    } = job.data;

    if (type === 'liveclass') {
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId, status: 'active' },
        select: { userId: true, user: { select: { phone: true, id: true } } },
      });

      const userIds = enrollments.map((e) => e.userId);

      for (const enrollment of enrollments) {
        const userId = enrollment.userId;

        await notificationQueue.add('send', {
          type: 'liveclass_reminder',
          userId,
          tenantId,
          title: '🔴 Live Class Starting Soon',
          message: `"${title}" starts in 15 minutes. Tap to join.`,
          data: { liveClassId },
        });

        await transactionalEmailQueue.add('send', {
          type: 'liveclass_reminder',
          data: { userId, title, scheduledAt, liveClassId },
        });

        // WhatsApp notification (non-blocking, fails silently if not configured)
        const phone = enrollment.user?.phone;
        if (phone) {
          sendLiveClassReminder(phone, title, scheduledAt).catch((err) =>
            logger.warn(`WhatsApp reminder failed for user ${userId}: ${err.message}`)
          );
        }
      }

      logger.info(`Reminder sent for live class ${liveClassId} to ${userIds.length} students`);
    } else if (type === 'announcement') {
      const roles = targetRoles || ['student', 'teacher'];
      const targetUsers = await prisma.user.findMany({
        where: {
          role: { in: roles },
          isActive: true,
          tenantId,
        },
        select: { id: true, name: true, email: true },
      });

      for (const user of targetUsers) {
        await notificationQueue.add('send', {
          type: 'announcement',
          userId: user.id,
          tenantId,
          title,
          message,
          data: { link: link || '' },
        });

        await transactionalEmailQueue.add('send', {
          type: 'announcement',
          data: {
            user,
            title,
            message,
          },
        });
      }
      logger.info(`Scheduled announcement "${title}" processed for ${targetUsers.length} users`);
    }
  },
  { connection: queueConnection, concurrency: 2 }
);

reminderWorker.on('failed', (job, err) => {
  logger.error(`Reminder job ${job?.id} failed:`, err.message);
});
