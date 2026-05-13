import cluster from 'cluster';
import os from 'os';
import logger from './utils/logger.js';

const numCPUs = Math.min(os.cpus().length, 4); // Max 4 workers

if (cluster.isPrimary) {
  logger.info(`Primary process ${process.pid} starting ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });

  cluster.on('online', (worker) => {
    logger.info(`Worker ${worker.process.pid} is online`);
  });
} else {
  import('./server.js');
}
