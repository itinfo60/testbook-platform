import './instrument.js'; // Sentry must be imported first
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import app from './app.js';
import config from './config/index.js';
import database from './config/database.js';
import redis from './config/redis.js';
import logger from './utils/logger.js';
import { initializeSocket } from './sockets/index.js';
import { transactionalEmailWorker, bulkEmailWorker } from './workers/email.worker.js';
import notificationWorker from './workers/notification.worker.js';
import certificateWorker from './workers/certificate.worker.js';
import dripWorker from './workers/drip.worker.js';
import { reminderWorker } from './workers/reminder.worker.js';
import dunningWorker from './workers/dunning.worker.js';
import { drainFailedJobs } from './queues/index.js';
import { startLiveClassCron, liveClassWorker } from './workers/liveclass.cron.js';

const server = http.createServer(app);

// ===== SOCKET.IO =====
const io = new SocketServer(server, {
  cors: {
    origin: [config.clientUrl, config.adminUrl, 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB
  transports: ['websocket', 'polling'],
});

// Make io accessible to routes
app.set('io', io);

// ===== STARTUP =====
const startServer = async () => {
  try {
    // Connect to PostgreSQL (Prisma)
    await database.connect();

    // Connect to Redis
    await redis.connect();

    // Set up Socket.IO Redis adapter for multi-instance support
    try {
      const redisUrl = config.redis.url || `redis://${config.redis.host}:${config.redis.port}`;
      const pubClient = createClient({
        url: redisUrl,
        password: config.redis.password || undefined,
      });
      const subClient = pubClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.IO Redis adapter connected');
    } catch (err) {
      logger.warn(
        'Socket.IO Redis adapter failed, using in-memory (single instance only):',
        err.message
      );
    }

    // Initialize Socket.IO
    initializeSocket(io);

    // Start BullMQ workers (log startup, workers are self-managing)
    logger.info(`BullMQ workers started: email, notification, certificate, drip, reminder`);

    // Start live class auto-transition cron (scheduled→live→ended)
    startLiveClassCron();

    // Drain stale zombie jobs from Redis on startup (dev only)
    await drainFailedJobs();

    // Start server
    server.listen(config.port, () => {
      logger.info('═══════════════════════════════════════════');
      logger.info(`🚀 CivicsEdu Server v2.0.0`);
      logger.info(`📡 Environment: ${config.env}`);
      logger.info(`🌐 Server: http://localhost:${config.port}`);
      logger.info(`📋 API: http://localhost:${config.port}/api/v1`);
      logger.info(`❤️  Health: http://localhost:${config.port}/health`);
      logger.info(`🔌 WebSocket: ws://localhost:${config.port}`);
      logger.info('═══════════════════════════════════════════');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// ===== GRACEFUL SHUTDOWN =====
const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  // Force shutdown after 30 seconds
  const timeoutId = setTimeout(() => {
    logger.error('Could not close connections in time. Forcing shutdown.');
    process.exit(1);
  }, 30000);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close Socket.IO connections
      io.close();
      logger.info('Socket.IO closed');

      // Stop workers
      await Promise.all([
        transactionalEmailWorker.close(),
        bulkEmailWorker.close(),
        notificationWorker.close(),
        certificateWorker.close(),
        dripWorker.close(),
        reminderWorker.close(),
        dunningWorker.close(),
        liveClassWorker.close(),
      ]);
      logger.info('BullMQ workers closed');

      // Disconnect from databases
      await database.disconnect();
      await redis.disconnect();

      clearTimeout(timeoutId);
      logger.info('All connections closed. Goodbye! 👋');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ===== UNHANDLED ERRORS =====
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('UNHANDLED REJECTION! 💥', reason);
  process.exit(1);
});

// Start
startServer();

export { server, io };
