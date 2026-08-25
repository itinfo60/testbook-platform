import { prisma } from '../../config/prisma.js';
import logger from '../../utils/logger.js';

class LogService {
  /**
   * Ingest single or batched application logs
   * Non-blocking to guarantee 0 impact on main request performance
   */
  async ingestLogs(logEntries, reqContext = {}) {
    const entries = Array.isArray(logEntries) ? logEntries : [logEntries];
    if (!entries.length) return { count: 0 };

    const records = entries.map((entry) => {
      const level = (entry.level || 'info').toLowerCase();
      const validLevels = ['error', 'warn', 'info', 'action'];
      const normalizedLevel = validLevels.includes(level) ? level : 'info';

      return {
        app: entry.app || reqContext.app || 'client',
        level: normalizedLevel,
        event: String(entry.event || 'UNKNOWN_EVENT').toUpperCase(),
        message: entry.message ? String(entry.message).slice(0, 2000) : null,
        details: entry.details && typeof entry.details === 'object' ? entry.details : {},
        path: entry.path || reqContext.path || null,
        method: entry.method || reqContext.method || null,
        statusCode: entry.statusCode ? Number(entry.statusCode) : null,
        userId: entry.userId || reqContext.userId || null,
        userEmail: entry.userEmail || reqContext.userEmail || null,
        userName: entry.userName || reqContext.userName || null,
        ip: entry.ip || reqContext.ip || null,
        userAgent: entry.userAgent || reqContext.userAgent || null,
        tenantId: entry.tenantId || reqContext.tenantId || null,
        createdAt: entry.timestamp ? new Date(entry.timestamp) : new Date(),
      };
    });

    try {
      const result = await prisma.appLog.createMany({
        data: records,
        skipDuplicates: true,
      });
      return { count: result.count };
    } catch (err) {
      logger.error('Failed to ingest AppLogs to database:', err.message);
      return { count: 0, error: err.message };
    }
  }

  /**
   * Query & filter application logs with pagination
   */
  async getLogs(query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 25));
    const skip = (page - 1) * limit;

    const where = {};

    // Filter by Application Source
    if (query.app && query.app !== 'all') {
      where.app = query.app;
    }

    // Filter by Log Level
    if (query.level && query.level !== 'all') {
      where.level = query.level.toLowerCase();
    }

    // Filter by Event
    if (query.event && query.event !== 'all') {
      where.event = { contains: query.event, mode: 'insensitive' };
    }

    // Filter by User ID or Email
    if (query.userId) {
      where.userId = query.userId;
    }
    if (query.userEmail) {
      where.userEmail = { contains: query.userEmail, mode: 'insensitive' };
    }

    // Date range
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    // Keyword Search in message, event, path, userEmail, userName
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { message: { contains: term, mode: 'insensitive' } },
        { event: { contains: term, mode: 'insensitive' } },
        { path: { contains: term, mode: 'insensitive' } },
        { userEmail: { contains: term, mode: 'insensitive' } },
        { userName: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.appLog.count({ where }),
      prisma.appLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Log aggregates and statistics for the dashboard
   */
  async getStats() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalCount,
      last24hCount,
      errors24h,
      warns24h,
      actions24h,
      info24h,
      clientCount24h,
      adminCount24h,
      recentErrors,
    ] = await Promise.all([
      prisma.appLog.count(),
      prisma.appLog.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.appLog.count({ where: { level: 'error', createdAt: { gte: oneDayAgo } } }),
      prisma.appLog.count({ where: { level: 'warn', createdAt: { gte: oneDayAgo } } }),
      prisma.appLog.count({ where: { level: 'action', createdAt: { gte: oneDayAgo } } }),
      prisma.appLog.count({ where: { level: 'info', createdAt: { gte: oneDayAgo } } }),
      prisma.appLog.count({ where: { app: 'client', createdAt: { gte: oneDayAgo } } }),
      prisma.appLog.count({ where: { app: 'admin', createdAt: { gte: oneDayAgo } } }),
      prisma.appLog.findMany({
        where: { level: 'error' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          app: true,
          event: true,
          message: true,
          path: true,
          userEmail: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      totalCount,
      last24h: {
        total: last24hCount,
        errors: errors24h,
        warnings: warns24h,
        actions: actions24h,
        info: info24h,
        client: clientCount24h,
        admin: adminCount24h,
      },
      recentErrors,
    };
  }

  /**
   * Purge logs older than X days
   */
  async purgeOldLogs(days = 30) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await prisma.appLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return { deletedCount: result.count };
  }
}

export default new LogService();
