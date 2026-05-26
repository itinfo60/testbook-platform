import { Worker } from 'bullmq';
import emailService from '../utils/email.js';
import logger from '../utils/logger.js';
import { queueConnection } from '../queues/index.js';

const emailWorker = new Worker(
  'email',
  async (job) => {
    const { type, data } = job.data;
    logger.info(`Processing email job [${job.id}] type=${type}`);

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
      default:
        throw new Error(`Unknown email type: ${type}`);
    }
  },
  {
    connection: queueConnection,
    concurrency: 5,
    limiter: { max: 50, duration: 60000 }, // 50 emails/min
  }
);

emailWorker.on('completed', (job) => {
  logger.info(`Email job [${job.id}] type=${job.data.type} completed`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`Email job [${job?.id}] type=${job?.data?.type} failed: ${err.message}`);
});

export default emailWorker;
