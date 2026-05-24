import { describe, it, expect, vi } from 'vitest';
import Joi from 'joi';
import validate from '../../src/middleware/validate.js';
import ApiError from '../../src/utils/ApiError.js';

describe('Validate Middleware', () => {
  const schema = Joi.object({
    name: Joi.string().required(),
    age: Joi.number().integer().min(18),
  });

  it('should call next() if validation passes', () => {
    const middleware = validate(schema);
    const req = { body: { name: 'Test', age: 20 } };
    const res = {};
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body).toEqual({ name: 'Test', age: 20 });
  });

  it('should validate req.query if source is query', () => {
    const middleware = validate(schema, 'query');
    const req = { query: { name: 'Test', age: '20' } }; // query string is parsed to number
    const res = {};
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.query).toEqual({ name: 'Test', age: 20 }); // Note: Joi convert=true casts string to number
  });

  it('should validate req.params if source is params', () => {
    const middleware = validate(schema, 'params');
    const req = { params: { name: 'Test', age: '25' } };
    const res = {};
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.params).toEqual({ name: 'Test', age: 25 });
  });

  it('should throw ApiError if validation fails', () => {
    const middleware = validate(schema);
    const req = { body: { age: 15 } }; // missing name, age < 18
    const res = {};
    const next = vi.fn();

    expect(() => middleware(req, res, next)).toThrow(ApiError);
    
    try {
      middleware(req, res, next);
    } catch (err) {
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('Validation failed');
      expect(err.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'age' })
        ])
      );
    }
    
    expect(next).not.toHaveBeenCalled();
  });

  it('should strip unknown fields', () => {
    const middleware = validate(schema);
    const req = { body: { name: 'Test', unknownField: 'foo' } };
    const res = {};
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body).toEqual({ name: 'Test' }); // unknownField is stripped
  });
});
