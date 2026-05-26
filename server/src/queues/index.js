import { Queue } from 'bullmq';
import config from '../config/index.js';

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  ...(config.redis.password && { password: config.redis.password }),
  maxRetriesPerRequest: null,
};

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
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

// Schedule daily dunning checks
dunningQueue.add(
  'check_expiring',
  { type: 'check_expiring' },
  {
    repeat: { pattern: '0 8 * * *' }, // every day at 8 AM
    jobId: 'dunning_expiring',
  }
);
dunningQueue.add(
  'check_expired',
  { type: 'check_expired' },
  {
    repeat: { pattern: '0 9 * * *' }, // every day at 9 AM
    jobId: 'dunning_expired',
  }
);

export const queueConnection = connection;
