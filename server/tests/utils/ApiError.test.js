import { describe, it, expect } from 'vitest';
import ApiError from '../../src/utils/ApiError.js';

describe('ApiError', () => {
  it('should create an ApiError with correct properties', () => {
    const error = new ApiError(400, 'Test error message', ['error1', 'error2']);
    
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Test error message');
    expect(error.success).toBe(false);
    expect(error.errors).toEqual(['error1', 'error2']);
    expect(error.isOperational).toBe(true);
  });

  it('should capture stack trace if not provided', () => {
    const error = new ApiError(500, 'Server error');
    expect(error.stack).toBeDefined();
  });

  it('should use provided stack trace', () => {
    const customStack = 'Error\n    at Object.<anonymous>';
    const error = new ApiError(500, 'Server error', [], customStack);
    expect(error.stack).toBe(customStack);
  });

  describe('Static Factory Methods', () => {
    it('badRequest', () => {
      const error = ApiError.badRequest('Custom bad request', ['err']);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Custom bad request');
      expect(error.errors).toEqual(['err']);
    });

    it('unauthorized', () => {
      const error = ApiError.unauthorized();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized');
    });

    it('forbidden', () => {
      const error = ApiError.forbidden();
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden');
    });

    it('notFound', () => {
      const error = ApiError.notFound();
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
    });

    it('conflict', () => {
      const error = ApiError.conflict();
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource already exists');
    });

    it('tooMany', () => {
      const error = ApiError.tooMany();
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Too many requests');
    });

    it('internal', () => {
      const error = ApiError.internal();
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Internal server error');
    });
  });
});
