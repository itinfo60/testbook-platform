import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cacheMiddleware, clearCache } from '../../src/middleware/cache.js';
import redis from '../../src/config/redis.js';
import logger from '../../src/utils/logger.js';

vi.mock('../../src/config/redis.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    delPattern: vi.fn(),
  }
}));

vi.mock('../../src/utils/logger.js', () => ({
  default: {
    debug: vi.fn(),
  }
}));

describe('Cache Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let originalJson;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      originalUrl: '/api/v1/test',
    };
    originalJson = vi.fn();
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: originalJson,
      statusCode: 200,
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('cacheMiddleware', () => {
    it('should skip caching if method is not GET', async () => {
      mockReq.method = 'POST';
      const middleware = cacheMiddleware('testPrefix');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(redis.get).not.toHaveBeenCalled();
    });

    it('should return cached response if hit', async () => {
      const cachedData = { data: 'test' };
      redis.get.mockResolvedValueOnce(cachedData);
      
      const middleware = cacheMiddleware('testPrefix');
      await middleware(mockReq, mockRes, mockNext);
      
      expect(redis.get).toHaveBeenCalledWith('testPrefix:/api/v1/test');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(cachedData);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should override res.json and set cache on miss', async () => {
      redis.get.mockResolvedValueOnce(null);
      redis.set.mockResolvedValueOnce('OK');
      
      const middleware = cacheMiddleware('testPrefix', 600);
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      
      // Simulate calling res.json in the route handler
      const body = { success: true };
      mockRes.json(body);
      
      expect(redis.set).toHaveBeenCalledWith('testPrefix:/api/v1/test', body, 600);
      expect(originalJson).toHaveBeenCalledWith(body);
    });

    it('should not cache if status code is >= 300', async () => {
      redis.get.mockResolvedValueOnce(null);
      
      const middleware = cacheMiddleware('testPrefix');
      await middleware(mockReq, mockRes, mockNext);
      
      mockRes.statusCode = 400;
      mockRes.json({ error: 'bad request' });
      
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('should proceed if redis.get throws an error', async () => {
      redis.get.mockRejectedValueOnce(new Error('Redis down'));
      
      const middleware = cacheMiddleware('testPrefix');
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('should override res.json and clear cache on success status', async () => {
      redis.delPattern.mockResolvedValueOnce(1);
      
      const middleware = clearCache('testPrefix');
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      
      mockRes.json({ updated: true });
      
      expect(redis.delPattern).toHaveBeenCalledWith('testPrefix:*');
      expect(originalJson).toHaveBeenCalledWith({ updated: true });
    });

    it('should not clear cache on error status', async () => {
      const middleware = clearCache('testPrefix');
      await middleware(mockReq, mockRes, mockNext);
      
      mockRes.statusCode = 400;
      mockRes.json({ error: true });
      
      expect(redis.delPattern).not.toHaveBeenCalled();
    });
  });
});
