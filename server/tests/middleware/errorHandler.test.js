import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notFoundHandler, errorConverter, errorHandler } from '../../src/middleware/errorHandler.js';
import ApiError from '../../src/utils/ApiError.js';
import logger from '../../src/utils/logger.js';
import config from '../../src/config/index.js';

// Mock logger to prevent actual logging during tests
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
  }
}));

// Mock config
vi.mock('../../src/config/index.js', () => ({
  default: {
    env: 'development',
  }
}));

describe('Error Handler Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      originalUrl: '/test',
      ip: '127.0.0.1',
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('notFoundHandler', () => {
    it('should call next with a 404 ApiError', () => {
      notFoundHandler(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Route not found: GET /test');
    });
  });

  describe('errorConverter', () => {
    it('should pass ApiError through unchanged', () => {
      const error = new ApiError(400, 'Test error');
      errorConverter(error, mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should convert standard Error to ApiError', () => {
      const error = new Error('Standard error');
      error.status = 400; // Simulating a status property
      
      errorConverter(error, mockReq, mockRes, mockNext);
      
      const nextError = mockNext.mock.calls[0][0];
      expect(nextError).toBeInstanceOf(ApiError);
      expect(nextError.statusCode).toBe(400);
      expect(nextError.message).toBe('Standard error');
      expect(nextError.isOperational).toBe(false);
    });

    it('should default to 500 status code if not provided', () => {
      const error = new Error('Standard error');
      
      errorConverter(error, mockReq, mockRes, mockNext);
      
      const nextError = mockNext.mock.calls[0][0];
      expect(nextError.statusCode).toBe(500);
    });
  });

  describe('errorHandler', () => {
    it('should handle Mongoose ValidationError', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      error.errors = {
        email: { path: 'email', message: 'Email is required' }
      };

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        statusCode: 400,
        message: 'Validation Error',
        errors: [{ field: 'email', message: 'Email is required' }],
      }));
    });

    it('should handle Mongoose Duplicate Key Error', () => {
      const error = new Error('Duplicate key');
      error.code = 11000;
      error.keyValue = { email: 'test@test.com' };

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        statusCode: 409,
        message: "Duplicate value for 'email'",
        errors: [{ field: 'email', message: "Duplicate value for 'email'" }],
      }));
    });

    it('should handle Mongoose CastError', () => {
      const error = new Error('Cast failed');
      error.name = 'CastError';
      error.path = '_id';
      error.value = 'invalid_id';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid _id: invalid_id',
      }));
    });

    it('should handle JsonWebTokenError', () => {
      const error = new Error('jwt malformed');
      error.name = 'JsonWebTokenError';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid token',
      }));
    });

    it('should handle TokenExpiredError', () => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Token expired',
      }));
    });

    it('should log error for 500 status codes', () => {
      const error = new ApiError(500, 'Server crashed');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(logger.error).toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should log warn for < 500 status codes', () => {
      const error = new ApiError(400, 'Bad request');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(logger.warn).toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should include stack trace in development env', () => {
      config.env = 'development';
      const error = new ApiError(400, 'Bad request');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        stack: expect.any(String),
      }));
    });

    it('should omit stack trace in production env', () => {
      config.env = 'production';
      const error = new ApiError(400, 'Bad request');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(expect.not.objectContaining({
        stack: expect.any(String),
      }));
    });
  });
});
