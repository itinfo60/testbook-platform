import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

export const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests. Please try again later.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: {
    success: false,
    statusCode: 429,
    message: 'Upload limit reached. Try again in an hour.',
  },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60,
  message: {
    success: false,
    statusCode: 429,
    message: 'API rate limit exceeded.',
  },
});
