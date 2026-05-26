import { Worker } from 'bullmq';
import emailService from '../utils/email.js';
import logger from '../utils/logger.js';
import { queueConnection } from '../queues/index.js';

// Handler for all email jobs
const processEmail = async (job) => {
  const { type, data } = job.data;
  logger.info(`Processing email job [${job.id}] type=${type} queue=${job.queueName}`);

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
      // Example bulk handling
      // await emailService.sendMarketingEmail(data.user, data.template);
      break;
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
};

export const transactionalEmailWorker = new Worker('transactional_email', processEmail, {
  connection: queueConnection,
  concurrency: 5,
  limiter: { max: 100, duration: 10000 }, // High priority: 100 emails/10sec
});

export const bulkEmailWorker = new Worker('bulk_email', processEmail, {
  connection: queueConnection,
  concurrency: 2,
  limiter: { max: 10, duration: 60000 }, // Low priority bulk: 10 emails/min
});

const attachListeners = (worker) => {
  worker.on('completed', (job) => {
    logger.info(`Email job [${job.id}] type=${job.data.type} queue=${job.queueName} completed`);
  });
  worker.on('failed', (job, err) => {
    logger.error(
      `Email job [${job?.id}] type=${job?.data?.type} queue=${job?.queueName} failed: ${err.message}`
    );
  });
};

attachListeners(transactionalEmailWorker);
attachListeners(bulkEmailWorker);
