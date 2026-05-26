import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../core/api-error.js';

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate =
        source === 'query' ? req.query : source === 'params' ? req.params : req.body;

      const parsed = schema.parse(dataToValidate);

      if (source === 'query') {
        req.query = parsed;
      } else if (source === 'params') {
        req.params = parsed;
      } else {
        req.body = parsed;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(ApiError.badRequest('Validation failed', errors));
      }
      next(error);
    }
  };
};

export default validate;
