import { Worker } from 'bullmq';
import { generateCertificatePDF } from '../utils/certificate.js';
import { transactionalEmailQueue } from '../queues/index.js';
import logger from '../utils/logger.js';
import { queueConnection } from '../queues/index.js';

const dummyWorker = { close: async () => {} };

const certificateWorker = queueConnection
  ? new Worker(
      'certificate',
      async (job) => {
        const { user, course, enrollment } = job.data;
        logger.info(`Generating certificate for user=${user._id} course=${course._id}`);

        const certificateUrl = await generateCertificatePDF({ user, course, enrollment });

        // Queue email with certificate
        await transactionalEmailQueue.add('send', {
          type: 'certificate',
          data: { user, course, certificateUrl },
        });

        return { certificateUrl };
      },
      {
        connection: queueConnection,
        concurrency: 2,
      }
    )
  : dummyWorker;

if (certificateWorker?.on) {
  certificateWorker.on('completed', (job, result) => {
    logger.info(`Certificate job [${job.id}] done: ${result?.certificateUrl}`);
  });

  certificateWorker.on('failed', (job, err) => {
    logger.error(`Certificate job [${job?.id}] failed: ${err.message}`);
  });
}

export default certificateWorker;
