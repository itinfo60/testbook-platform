import { Worker, UnrecoverableError } from 'bullmq';
import emailService, { PermanentEmailError } from '../utils/email.js';
import logger from '../utils/logger.js';
import { queueConnection } from '../queues/index.js';

// Handler for all email jobs
const processEmail = async (job) => {
  const { type, data } = job.data;
  logger.info(`Processing email job [${job.id}] type=${type} queue=${job.queueName}`);

  try {
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
      case 'marketing':
      case 'bulk':
        // Bulk email sending handled separately — no-op here
        break;
      case 'announcement':
        await emailService.sendAnnouncementEmail(data.user, data.title, data.message);
        break;
      default:
        // Unknown type — do not retry
        throw new UnrecoverableError(`Unknown email type: ${type}`);
    }
  } catch (err) {
    if (err instanceof PermanentEmailError || err instanceof UnrecoverableError) {
      // Convert to BullMQ UnrecoverableError so the job is moved to failed
      // immediately without burning through retry attempts
      throw new UnrecoverableError(err.message);
    }
    // Re-throw transient errors (network timeouts etc.) for BullMQ to retry
    throw err;
  }
};

export const transactionalEmailWorker = new Worker('transactional_email', processEmail, {
  connection: queueConnection,
  concurrency: 5,
  limiter: { max: 100, duration: 10000 }, // High priority: 100 emails/10 sec
});

export const bulkEmailWorker = new Worker('bulk_email', processEmail, {
  connection: queueConnection,
  concurrency: 2,
  limiter: { max: 10, duration: 60000 }, // Low priority bulk: 10 emails/min
});

const attachListeners = (worker) => {
  worker.on('completed', (job) => {
    logger.info(
      `[Email] ✅ Job [${job.id}] type=${job.data.type} queue=${job.queueName} completed`
    );
  });
  worker.on('failed', (job, err) => {
    const isUnrecoverable = err?.name === 'UnrecoverableError';
    const level = isUnrecoverable ? 'warn' : 'error';
    logger[level](
      `[Email] ${isUnrecoverable ? '🚫 Permanent failure' : '❌ Failed'} job [${job?.id}] type=${job?.data?.type} queue=${job?.queueName}: ${err.message}`
    );
  });
};

attachListeners(transactionalEmailWorker);
attachListeners(bulkEmailWorker);
