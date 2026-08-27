import { Worker } from 'bullmq';
import prisma from '../config/prisma.js';
import { notificationQueue } from '../queues/index.js';
import logger from '../utils/logger.js';
import { queueConnection } from '../queues/index.js';
import { runWithTenant } from '../utils/TenantContext.js';

/**
 * Drip content worker — called per-enrollment when a drip lesson unlocks.
 * Job payload: { enrollmentId, lessonId, sectionId, lessonTitle, courseTitle, tenantId }
 */
const dummyWorker = { close: async () => {} };

const dripWorker = queueConnection
  ? new Worker(
      'drip',
      async (job) => {
        const { enrollmentId, lessonId, sectionId, lessonTitle, courseTitle, tenantId } = job.data;
        logger.info(`Drip unlock: enrollment=${enrollmentId} lesson=${lessonId}`);

        await runWithTenant(tenantId, false, async () => {
          const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
          if (!enrollment || enrollment.status !== 'active') return;

          // Notify the student
          await notificationQueue.add('send', {
            type: 'drip_unlock',
            userId: enrollment.userId,
            tenantId,
            title: 'New Lesson Unlocked',
            message: `"${lessonTitle}" is now available in ${courseTitle}`,
            data: { courseId: enrollment.courseId, lessonId, sectionId },
          });
        });
      },
      { connection: queueConnection, concurrency: 20 }
    )
  : dummyWorker;

if (dripWorker?.on) {
  dripWorker.on('failed', (job, err) => {
    logger.error(`Drip job [${job?.id}] failed: ${err.message}`);
  });
}

export default dripWorker;
