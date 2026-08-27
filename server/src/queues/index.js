import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import emailService from '../utils/email.js';
import prisma from '../config/prisma.js';
import { sendMulticastPush } from '../utils/pushNotification.js';
import { generateCertificatePDF } from '../utils/certificate.js';

class DirectQueue {
  constructor(name, handler) {
    this.name = name;
    this.handler = handler;
  }

  async add(jobName, data = {}, options = {}) {
    const job = {
      id: `dir_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: jobName,
      data,
      queueName: this.name,
    };
    if (this.handler) {
      setImmediate(async () => {
        try {
          await this.handler(job);
        } catch (err) {
          logger.error(`[DirectQueue:${this.name}] Execution error:`, err.message);
        }
      });
    }
    return job;
  }

  async getJobCounts() {
    return { failed: 0, delayed: 0, waiting: 0, active: 0, completed: 0 };
  }
  async clean() {
    return 0;
  }
  async close() {
    return true;
  }
}

// ── Direct handlers when running without Redis ──────────────────────────────
const directEmailHandler = async (job) => {
  const { type, data } = job.data || {};
  if (!type || !data) return;
  switch (type) {
    case 'verification':
      await emailService.sendVerificationEmail(data.user, data.token);
      break;
    case 'reset_password':
      await emailService.sendResetPasswordEmail(data.user, data.token);
      break;
    case 'enrollment_confirmation':
      await emailService.sendEnrollmentConfirmation(data.user, data.course);
      break;
    case 'certificate':
      await emailService.sendCertificateEmail(data.user, data.course, data.certificateUrl);
      break;
    case 'welcome':
      await emailService.sendWelcomeEmail(data.user);
      break;
    case 'announcement':
      await emailService.sendAnnouncementEmail(data.user, data.title, data.message);
      break;
    default:
      break;
  }
};

const directNotificationHandler = async (job) => {
  const { type, userId, tenantId, title, message, data } = job.data || {};
  if (!userId) return;

  await prisma.notification
    .create({
      data: {
        userId,
        tenantId: tenantId || null,
        type: type || 'general',
        title: title || 'Notification',
        message: message || '',
        data: data || {},
      },
    })
    .catch((err) => logger.warn(`[DirectNotification] Save failed: ${err.message}`));

  const user = await prisma.user
    .findUnique({
      where: { id: userId },
      select: { fcmTokens: true },
    })
    .catch(() => null);

  if (user?.fcmTokens?.length) {
    await sendMulticastPush({ tokens: user.fcmTokens, title, body: message, data }).catch(() => {});
  }
};

const directCertificateHandler = async (job) => {
  const { user, course, enrollment } = job.data || {};
  if (!user || !course) return;
  const certificateUrl = await generateCertificatePDF({ user, course, enrollment });
  await transactionalEmailQueue.add('send', {
    type: 'certificate',
    data: { user, course, certificateUrl },
  });
};

const isRedisEnabled = Boolean(config.redis.enabled);

export let queueConnection = null;
let connection = null;

if (isRedisEnabled) {
  queueConnection = config.redis.url
    ? new IORedis(config.redis.url, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        tls: config.redis.url.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
      })
    : {
        host: config.redis.host,
        port: config.redis.port,
        ...(config.redis.password && { password: config.redis.password }),
        maxRetriesPerRequest: null,
      };
  connection = queueConnection;
}

const defaultJobOptions = {
  attempts: 2,
  backoff: { type: 'exponential', delay: 3000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
};

export const transactionalEmailQueue = isRedisEnabled
  ? new Queue('transactional_email', { connection, defaultJobOptions })
  : new DirectQueue('transactional_email', directEmailHandler);

export const bulkEmailQueue = isRedisEnabled
  ? new Queue('bulk_email', { connection, defaultJobOptions })
  : new DirectQueue('bulk_email', directEmailHandler);

export const notificationQueue = isRedisEnabled
  ? new Queue('notification', { connection, defaultJobOptions })
  : new DirectQueue('notification', directNotificationHandler);

export const certificateQueue = isRedisEnabled
  ? new Queue('certificate', { connection, defaultJobOptions })
  : new DirectQueue('certificate', directCertificateHandler);

export const dripQueue = isRedisEnabled
  ? new Queue('drip', { connection, defaultJobOptions })
  : new DirectQueue('drip', () => {});

export const reminderQueue = isRedisEnabled
  ? new Queue('reminder', { connection, defaultJobOptions })
  : new DirectQueue('reminder', () => {});

export const dunningQueue = isRedisEnabled
  ? new Queue('dunning', { connection, defaultJobOptions })
  : new DirectQueue('dunning', () => {});

export const analyticsQueue = isRedisEnabled
  ? new Queue('analytics', {
      connection,
      defaultJobOptions: { attempts: 1, removeOnComplete: { count: 200 } },
    })
  : new DirectQueue('analytics', () => {});

export const liveClassQueue = isRedisEnabled
  ? new Queue('liveclass', { connection, defaultJobOptions })
  : new DirectQueue('liveclass', () => {});

if (isRedisEnabled) {
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
  liveClassQueue.add(
    'auto_transition',
    { type: 'auto_transition' },
    { repeat: { every: 60000 }, jobId: 'liveclass_auto_transition', removeOnComplete: { count: 5 } }
  );
}

export async function drainFailedJobs() {
  if (!isRedisEnabled || config.env === 'production') return;

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
        totalCleaned += counts.failed;
      }
    } catch (err) {
      logger.warn(`[Queue] Could not clean queue ${q.name}: ${err.message}`);
    }
  }
}
