import { Worker } from 'bullmq';
import { queueConnection } from '../queues/index.js';
import { notificationQueue, transactionalEmailQueue } from '../queues/index.js';
import Enrollment from '../modules/enrollment/enrollment.model.js';
import User from '../modules/user/user.model.js';
import logger from '../utils/logger.js';
import { sendLiveClassReminder } from '../utils/whatsapp.js';

export const reminderWorker = new Worker(
  'reminder',
  async (job) => {
    const { type, liveClassId, title, scheduledAt, tenantId, courseId } = job.data;

    if (type === 'liveclass') {
      const enrollments = await Enrollment.find({ course: courseId, status: 'active' })
        .select('user')
        .populate('user', 'phone')
        .lean();

      const userIds = enrollments.map((e) => e.user?._id?.toString() || e.user?.toString());

      // Fetch user phone numbers for WhatsApp
      const users = await User.find({ _id: { $in: userIds } })
        .select('phone _id')
        .lean();
      const phoneMap = {};
      for (const u of users) {
        if (u.phone) phoneMap[u._id.toString()] = u.phone;
      }

      for (const enrollment of enrollments) {
        const userId = enrollment.user?._id?.toString() || enrollment.user?.toString();

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
        const phone = phoneMap[userId];
        if (phone) {
          sendLiveClassReminder(phone, title, scheduledAt).catch((err) =>
            logger.warn(`WhatsApp reminder failed for user ${userId}: ${err.message}`)
          );
        }
      }

      logger.info(`Reminder sent for live class ${liveClassId} to ${userIds.length} students`);
    }
  },
  { connection: queueConnection, concurrency: 2 }
);

reminderWorker.on('failed', (job, err) => {
  logger.error(`Reminder job ${job?.id} failed:`, err.message);
});
