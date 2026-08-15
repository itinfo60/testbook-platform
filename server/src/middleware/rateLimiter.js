import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import config from '../config/index.js';
import redis from '../config/redis.js';

// Build a Redis store only when the Redis client is connected
const makeStore = () => {
  if (!redis.isConnected || !redis.client) return undefined;
  return new RedisStore({
    sendCommand: (...args) => redis.client.sendCommand(args),
    prefix: 'rl:',
  });
};

const noopMiddleware = (_req, _res, next) => next();

const limiterOptions = (windowMs, max, message, prefix = 'rl') => ({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  store: makeStore(),
  message: { success: false, statusCode: 429, message },
  keyGenerator: (req) => `${prefix}:${req.ip}`,
});

const isTest = config.env === 'test';

export const globalLimiter = isTest
  ? noopMiddleware
  : rateLimit(
      limiterOptions(
        config.rateLimit.windowMs,
        config.rateLimit.max,
        'Too many requests. Please try again later.',
        'global'
      )
    );

const authMax = config.env === 'development' ? 200 : 10;
export const authLimiter = isTest
  ? noopMiddleware
  : rateLimit(
      limiterOptions(
        15 * 60 * 1000,
        authMax,
        'Too many login attempts. Please try again after 15 minutes.',
        'auth'
      )
    );

export const uploadLimiter = isTest
  ? noopMiddleware
  : rateLimit(
      limiterOptions(60 * 60 * 1000, 50, 'Upload limit reached. Try again in an hour.', 'upload')
    );

export const apiLimiter = isTest
  ? noopMiddleware
  : rateLimit(limiterOptions(60 * 1000, 60, 'API rate limit exceeded.', 'api'));

export const createRateLimiter = (windowMs, max, message, prefix = 'custom') =>
  isTest ? noopMiddleware : rateLimit(limiterOptions(windowMs, max, message, prefix));
