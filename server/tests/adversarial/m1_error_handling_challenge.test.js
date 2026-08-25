import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/node';
import { Prisma } from '@prisma/client';
import {
  notFoundHandler,
  errorConverter,
  errorHandler,
} from '../../src/middleware/errorHandler.js';
import ApiError from '../../src/utils/ApiError.js';
import logger from '../../src/utils/logger.js';
import config from '../../src/config/index.js';

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
  withScope: vi.fn((cb) => {
    cb({
      setTag: vi.fn(),
      setUser: vi.fn(),
      setExtra: vi.fn(),
    });
  }),
}));

vi.mock('../../src/utils/logger.js', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('../../src/config/index.js', () => ({
  default: {
    env: 'development',
  },
}));

describe('Milestone 1 Adversarial Challenge: Prisma Error Handling & Response Formatting', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      id: 'req-uuid-1',
      method: 'POST',
      originalUrl: '/api/v1/courses',
      ip: '192.168.1.1',
      userId: 'user-uuid-1',
      tenantId: 'inst-uuid-1',
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. PrismaClientKnownRequestError: P2002 Unique Constraint Violations
  // =========================================================================
  describe('1. P2002 Unique Constraint Violation', () => {
    it('should convert P2002 with target array to 409 Conflict with joined field name', () => {
      const err = new Error('Unique constraint failed on the fields: (`subdomain`, `tenantId`)');
      err.name = 'PrismaClientKnownRequestError';
      err.code = 'P2002';
      err.meta = { target: ['subdomain', 'tenantId'] };

      errorConverter(err, mockReq, mockRes, mockNext);

      const converted = mockNext.mock.calls[0][0];
      expect(converted).toBeInstanceOf(ApiError);
      expect(converted.statusCode).toBe(409);
      expect(converted.message).toBe("Duplicate value for 'subdomain, tenantId'");
      expect(converted.errors).toEqual([
        { field: 'subdomain, tenantId', message: "Duplicate value for 'subdomain, tenantId'" },
      ]);
      expect(converted.isOperational).toBe(true);

      // Execute errorHandler
      errorHandler(converted, mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 409,
          message: "Duplicate value for 'subdomain, tenantId'",
          errors: [
            { field: 'subdomain, tenantId', message: "Duplicate value for 'subdomain, tenantId'" },
          ],
        })
      );
    });

    it('should convert P2002 with string target to 409 Conflict', () => {
      const err = new Error('Unique constraint failed on the field: `email`');
      err.name = 'PrismaClientKnownRequestError';
      err.code = 'P2002';
      err.meta = { target: 'email' };

      errorConverter(err, mockReq, mockRes, mockNext);

      const converted = mockNext.mock.calls[0][0];
      expect(converted.statusCode).toBe(409);
      expect(converted.message).toBe("Duplicate value for 'email'");
    });

    it('should convert P2002 without target to 409 Conflict with fallback field label', () => {
      const err = new Error('Unique constraint failed');
      err.name = 'PrismaClientKnownRequestError';
      err.code = 'P2002';
      err.meta = {};

      errorConverter(err, mockReq, mockRes, mockNext);

      const converted = mockNext.mock.calls[0][0];
      expect(converted.statusCode).toBe(409);
      expect(converted.message).toBe("Duplicate value for 'field'");
    });
  });

  // =========================================================================
  // 2. PrismaClientKnownRequestError: P2025 Record Not Found
  // =========================================================================
  describe('2. P2025 Record Not Found', () => {
    it('should convert P2025 with cause to 404 Not Found', () => {
      const err = new Error(
        'An operation failed because it depends on one or more records that were required but not found.'
      );
      err.name = 'PrismaClientKnownRequestError';
      err.code = 'P2025';
      err.meta = { cause: 'User record with id `uuid-99` does not exist' };

      errorConverter(err, mockReq, mockRes, mockNext);

      const converted = mockNext.mock.calls[0][0];
      expect(converted.statusCode).toBe(404);
      expect(converted.message).toBe('User record with id `uuid-99` does not exist');
      expect(converted.isOperational).toBe(true);

      errorHandler(converted, mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should convert P2025 without cause to 404 with default message', () => {
      const err = new Error('Not found');
      err.name = 'PrismaClientKnownRequestError';
      err.code = 'P2025';
      err.meta = {};

      errorConverter(err, mockReq, mockRes, mockNext);

      const converted = mockNext.mock.calls[0][0];
      expect(converted.statusCode).toBe(404);
      expect(converted.message).toBe('Record not found');
    });
  });

  // =========================================================================
  // 3. PrismaClientKnownRequestError: P2003 Foreign Key Violation
  // =========================================================================
  describe('3. P2003 Foreign Key Violation', () => {
    it('should convert P2003 with field_name to 400 Bad Request', () => {
      const err = new Error('Foreign key constraint failed on the field: `courseId`');
      err.name = 'PrismaClientKnownRequestError';
      err.code = 'P2003';
      err.meta = { field_name: 'courseId' };

      errorConverter(err, mockReq, mockRes, mockNext);

      const converted = mockNext.mock.calls[0][0];
      expect(converted.statusCode).toBe(400);
      expect(converted.message).toBe('Invalid relation reference: courseId');
    });

    it('should convert P2003 without field_name to 400 Bad Request with relation default', () => {
      const err = new Error('Foreign key constraint failed');
      err.name = 'PrismaClientKnownRequestError';
      err.code = 'P2003';
      err.meta = {};

      errorConverter(err, mockReq, mockRes, mockNext);

      const converted = mockNext.mock.calls[0][0];
      expect(converted.statusCode).toBe(400);
      expect(converted.message).toBe('Invalid relation reference: relation');
    });
  });

  // =========================================================================
  // 4. PrismaClientKnownRequestError: P2000 Value Exceeds Maximum Length
  // =========================================================================
  describe('4. P2000 Value Exceeds Maximum Length', () => {
    it('should convert P2000 to 400 Bad Request', () => {
      const err = new Error('The provided value for the column is too long');
      err.name = 'PrismaClientKnownRequestError';
      err.code = 'P2000';

      errorConverter(err, mockReq, mockRes, mockNext);

      const converted = mockNext.mock.calls[0][0];
      expect(converted.statusCode).toBe(400);
      expect(converted.message).toBe('Provided value exceeds maximum length');
    });
  });

  // =========================================================================
  // 5. PrismaClientValidationError & PrismaClientInitializationError
  // =========================================================================
  describe('5. Prisma Validation & Initialization Errors', () => {
    it('should convert PrismaClientValidationError to 400 Bad Request', () => {
      const err = new Error('Argument `title` is missing.');
      err.name = 'PrismaClientValidationError';

      errorConverter(err, mockReq, mockRes, mockNext);

      const converted = mockNext.mock.calls[0][0];
      expect(converted.statusCode).toBe(400);
      expect(converted.message).toBe('Database validation error: Invalid input data');
      expect(converted.isOperational).toBe(true);
    });

    it('should convert PrismaClientInitializationError to 503 Service Unavailable and capture in Sentry', () => {
      const err = new Error("Can't reach database server at `localhost`:`5432`");
      err.name = 'PrismaClientInitializationError';

      errorConverter(err, mockReq, mockRes, mockNext);

      const converted = mockNext.mock.calls[0][0];
      expect(converted.statusCode).toBe(503);
      expect(converted.message).toBe('Database service temporarily unavailable');
      expect(converted.isOperational).toBe(false);

      // Error handler execution
      errorHandler(converted, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 503,
          message: 'Database service temporarily unavailable',
        })
      );
      expect(Sentry.withScope).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 6. Generic Database Errors & Environment Stack Trace Controls
  // =========================================================================
  describe('6. Generic Prisma Errors & Stack Trace Discipline', () => {
    it('should convert unknown Prisma known request error to 400 Database error', () => {
      const err = new Error('Raw query execution error');
      err.name = 'PrismaClientKnownRequestError';
      err.code = 'P2010';

      errorConverter(err, mockReq, mockRes, mockNext);

      const converted = mockNext.mock.calls[0][0];
      expect(converted.statusCode).toBe(400);
      expect(converted.message).toBe('Database error: Raw query execution error');
    });

    it('should include stack trace in JSON response when env is development', () => {
      config.env = 'development';
      const err = new ApiError(400, 'Invalid parameter');

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: expect.any(String),
        })
      );
    });

    it('should omit stack trace in JSON response when env is production', () => {
      config.env = 'production';
      const err = new ApiError(400, 'Invalid parameter');

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          stack: expect.any(String),
        })
      );
    });

    it('notFoundHandler should dispatch 404 ApiError', () => {
      notFoundHandler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const err = mockNext.mock.calls[0][0];
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Route not found: POST /api/v1/courses');
    });
  });
});
