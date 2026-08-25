/**
 * Live Class Auto-Transition Worker & Cron
 * Handles:
 *  - scheduled → live  when scheduledAt <= now
 *  - live      → ended when scheduledAt + duration min <= now
 */
import { Worker } from 'bullmq';
import { queueConnection } from '../queues/index.js';
import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';
import { getIO } from '../sockets/index.js';

let cronInterval = null;

export async function runTransitions() {
  const now = new Date();

  try {
    // 1. scheduled → live: scheduledAt has arrived
    const scheduledToStart = await prisma.liveClass.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: { lte: now },
      },
      select: { id: true, title: true, roomId: true, course: true },
    });

    if (scheduledToStart.length > 0) {
      const ids = scheduledToStart.map((c) => c.id);
      await prisma.liveClass.updateMany({
        where: { id: { in: ids } },
        data: { status: 'live' },
      });

      const io = getIO();
      for (const cls of scheduledToStart) {
        logger.info(`[LiveClass] Class "${cls.title}" (${cls.id}) transitioned scheduled → live`);
        if (io) {
          io.to(`liveclass:${cls.id}`).emit('live_class_started', {
            liveClassId: cls.id,
            title: cls.title,
            roomId: cls.roomId,
          });
          io.emit('live_class_status_changed', { liveClassId: cls.id, status: 'live' });
        }
      }
    }

    // 2. live → ended: scheduledAt + duration minutes has elapsed
    const liveClasses = await prisma.liveClass.findMany({
      where: { status: 'live' },
      select: { id: true, title: true, scheduledAt: true, duration: true },
    });

    const toEnd = liveClasses.filter((cls) => {
      const endTime = new Date(new Date(cls.scheduledAt).getTime() + cls.duration * 60000);
      return endTime <= now;
    });

    if (toEnd.length > 0) {
      const toEndIds = toEnd.map((cls) => cls.id);
      await prisma.liveClass.updateMany({
        where: { id: { in: toEndIds } },
        data: { status: 'ended' },
      });

      const io = getIO();
      for (const cls of toEnd) {
        logger.info(`[LiveClass] Class "${cls.title}" (${cls.id}) transitioned live → ended`);
        if (io) {
          io.to(`liveclass:${cls.id}`).emit('live_class_ended', { liveClassId: cls.id });
          io.emit('live_class_status_changed', { liveClassId: cls.id, status: 'ended' });
        }
      }
    }
  } catch (err) {
    logger.error(`[LiveClass] runTransitions error: ${err.message}`);
  }
}

export const liveClassWorker = new Worker(
  'liveclass',
  async (job) => {
    if (job.name === 'auto_transition') {
      await runTransitions();
    }
  },
  { connection: queueConnection }
);

liveClassWorker.on('failed', (job, err) => {
  logger.error(`[LiveClass Worker] Job failed: ${err.message}`);
});

export function startLiveClassCron() {
  // Run immediately on boot
  runTransitions().catch((err) =>
    logger.error(`[LiveClass] Initial startup run failed: ${err.message}`)
  );

  // Regular in-process fallback check every 30 seconds for guaranteed real-time transitions
  if (!cronInterval) {
    cronInterval = setInterval(runTransitions, 30000);
  }
  logger.info('[LiveClass Cron] Auto-transition active (every 30s + BullMQ)');
}
