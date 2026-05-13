import redis from '../config/redis.js';
import logger from '../utils/logger.js';

export const cacheMiddleware = (keyPrefix, ttl = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    const cacheKey = `${keyPrefix}:${req.originalUrl}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug(`Cache HIT: ${cacheKey}`);
        return res.status(200).json(cached);
      }
    } catch {
      // Continue without cache
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redis.set(cacheKey, body, ttl).catch(() => {});
        logger.debug(`Cache SET: ${cacheKey}`);
      }
      return originalJson(body);
    };

    next();
  };
};

export const clearCache = (keyPrefix) => {
  return async (req, res, next) => {
    // Override res.json to clear cache after successful mutation
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redis.delPattern(`${keyPrefix}:*`).catch(() => {});
        logger.debug(`Cache CLEAR: ${keyPrefix}:*`);
      }
      return originalJson(body);
    };
    next();
  };
};
