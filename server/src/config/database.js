import prisma from './prisma.js';
import logger from '../utils/logger.js';

class Database {
  constructor() {
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000;
    this.isConnected = false;
  }

  async connect() {
    try {
      await prisma.$connect();
      // Test query to verify active connection
      await prisma.$queryRaw`SELECT 1`;
      this.isConnected = true;
      this.retryCount = 0;
      logger.info('📦 PostgreSQL (Prisma) connected successfully');
      return prisma;
    } catch (error) {
      this.isConnected = false;
      logger.error('PostgreSQL initial connection failed:', error.message);
      return this._reconnect();
    }
  }

  async _reconnect() {
    if (this.retryCount >= this.maxRetries) {
      logger.error(`PostgreSQL: Max retries (${this.maxRetries}) reached. Exiting.`);
      process.exit(1);
    }

    this.retryCount++;
    logger.info(
      `PostgreSQL: Retry ${this.retryCount}/${this.maxRetries} in ${this.retryDelay / 1000}s...`
    );

    await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
    return this.connect();
  }

  async disconnect() {
    if (this.isConnected) {
      await prisma.$disconnect();
      this.isConnected = false;
      logger.info('PostgreSQL (Prisma) disconnected gracefully');
    }
  }

  async getStatus() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'connected',
        provider: 'postgresql',
      };
    } catch {
      return {
        status: 'disconnected',
        provider: 'postgresql',
      };
    }
  }
}

export const db = new Database();
export default db;
