import { Queue } from 'bullmq';
import config from '../config/index.js';
import logger from '../utils/logger.js';

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  ...(config.redis.password && { password: config.redis.password }),
  maxRetriesPerRequest: null,
};

const defaultJobOptions = {
  attempts: 2, // Down from 3 — auth errors shouldn't burn 3 rounds
  backoff: { type: 'exponential', delay: 3000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 }, // Keep only last 50 failed jobs for inspection
};

export const transactionalEmailQueue = new Queue('transactional_email', {
  connection,
  defaultJobOptions,
});
export const bulkEmailQueue = new Queue('bulk_email', { connection, defaultJobOptions });
export const notificationQueue = new Queue('notification', { connection, defaultJobOptions });
export const certificateQueue = new Queue('certificate', { connection, defaultJobOptions });
export const dripQueue = new Queue('drip', { connection, defaultJobOptions });
export const reminderQueue = new Queue('reminder', { connection, defaultJobOptions });
export const dunningQueue = new Queue('dunning', { connection, defaultJobOptions });
export const analyticsQueue = new Queue('analytics', {
  connection,
  defaultJobOptions: { attempts: 1, removeOnComplete: { count: 200 } },
});

// ── Scheduled dunning checks ────────────────────────────────────────────────
dunningQueue.add(
  'check_expiring',
  { type: 'check_expiring' },
  { repeat: { pattern: '0 8 * * *' }, jobId: 'dunning_expiring' }
);
dunningQueue.add(
  'check_expired',
  { type: 'check_expired' },
  { repeat: { pattern: '0 9 * * *' }, jobId: 'dunning_expired' }
);

// ── Live class status transitions (every minute) ─────────────────────────────
export const liveClassQueue = new Queue('liveclass', { connection, defaultJobOptions });
liveClassQueue.add(
  'auto_transition',
  { type: 'auto_transition' },
  { repeat: { every: 60000 }, jobId: 'liveclass_auto_transition', removeOnComplete: { count: 5 } }
);

export const queueConnection = connection;

// ── Dev utility: drain all stale failed jobs from every queue ────────────────
export async function drainFailedJobs() {
  if (config.env === 'production') return;

  const queues = [
    transactionalEmailQueue,
    bulkEmailQueue,
    notificationQueue,
    certificateQueue,
    dripQueue,
    reminderQueue,
    dunningQueue,
    analyticsQueue,
  ];

  let totalCleaned = 0;
  for (const q of queues) {
    try {
      const counts = await q.getJobCounts('failed', 'delayed');
      if (counts.failed > 0) {
        await q.clean(0, counts.failed, 'failed');
        logger.info(`[Queue] 🧹 Cleaned ${counts.failed} failed jobs from queue: ${q.name}`);
        totalCleaned += counts.failed;
      }
    } catch (err) {
      logger.warn(`[Queue] Could not clean queue ${q.name}: ${err.message}`);
    }
  }

  if (totalCleaned > 0) {
    logger.info(`[Queue] ✅ Total zombie jobs drained: ${totalCleaned}`);
  }
}
