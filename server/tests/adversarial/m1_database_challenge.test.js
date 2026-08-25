import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import prisma from '../../src/config/prisma.js';
import logger from '../../src/utils/logger.js';
import { db } from '../../src/config/database.js';

vi.mock('../../src/config/prisma.js', () => ({
  default: {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $queryRaw: vi.fn(),
  },
}));

vi.mock('../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Milestone 1 Adversarial Challenge: Database Lifecycle & Retry Mechanism', () => {
  let exitSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    db.isConnected = false;
    db.retryCount = 0;
    db.retryDelay = 10; // shorten delay for testing
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit: ${code}`);
    });
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  describe('1. Connection Lifecycle', () => {
    it('should connect successfully and set isConnected to true on first attempt', async () => {
      prisma.$connect.mockResolvedValueOnce(undefined);
      prisma.$queryRaw.mockResolvedValueOnce([{ 1: 1 }]);

      const result = await db.connect();

      expect(result).toBe(prisma);
      expect(db.isConnected).toBe(true);
      expect(db.retryCount).toBe(0);
      expect(prisma.$connect).toHaveBeenCalledTimes(1);
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('📦 PostgreSQL (Prisma) connected successfully');
    });

    it('should disconnect cleanly and update isConnected state', async () => {
      db.isConnected = true;
      prisma.$disconnect.mockResolvedValueOnce(undefined);

      await db.disconnect();

      expect(db.isConnected).toBe(false);
      expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('PostgreSQL (Prisma) disconnected gracefully');
    });

    it('disconnect should be a no-op if already disconnected', async () => {
      db.isConnected = false;

      await db.disconnect();

      expect(prisma.$disconnect).not.toHaveBeenCalled();
    });
  });

  describe('2. Retry Mechanism & Resilience', () => {
    it('should retry when initial connection fails and succeed on subsequent attempt', async () => {
      // 1st attempt: fails
      prisma.$connect.mockRejectedValueOnce(new Error('Connection timeout'));
      // 2nd attempt: succeeds
      prisma.$connect.mockResolvedValueOnce(undefined);
      prisma.$queryRaw.mockResolvedValueOnce([{ 1: 1 }]);

      const result = await db.connect();

      expect(result).toBe(prisma);
      expect(db.isConnected).toBe(true);
      expect(db.retryCount).toBe(0); // reset on success
      expect(logger.error).toHaveBeenCalledWith(
        'PostgreSQL initial connection failed:',
        'Connection timeout'
      );
      expect(logger.info).toHaveBeenCalledWith('PostgreSQL: Retry 1/5 in 0.01s...');
    });

    it('should terminate process when max retries (5) are reached without recovery', async () => {
      db.maxRetries = 2; // set to 2 for fast test
      db.retryDelay = 5;

      prisma.$connect.mockRejectedValue(new Error('Database cluster down'));

      await expect(db.connect()).rejects.toThrow('process.exit: 1');

      expect(logger.error).toHaveBeenCalledWith('PostgreSQL: Max retries (2) reached. Exiting.');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('3. Health Status Probe (getStatus)', () => {
    it('should report status connected when query succeeds', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([{ 1: 1 }]);

      const status = await db.getStatus();

      expect(status).toEqual({
        status: 'connected',
        provider: 'postgresql',
      });
    });

    it('should report status disconnected when database query throws', async () => {
      prisma.$queryRaw.mockRejectedValueOnce(new Error('Connection lost'));

      const status = await db.getStatus();

      expect(status).toEqual({
        status: 'disconnected',
        provider: 'postgresql',
      });
    });
  });
});
