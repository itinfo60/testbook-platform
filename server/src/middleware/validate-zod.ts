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
      // Handle ZodError — use instanceof or duck-type check for ESM interop safety
      const issues = (error as any)?.errors ?? (error as any)?.issues;
      if (error instanceof ZodError || (issues && Array.isArray(issues))) {
        const errs = (issues || (error as ZodError).errors).map((err: any) => ({
          field: Array.isArray(err.path) ? err.path.join('.') : String(err.path ?? ''),
          message: err.message,
        }));
        const reason = errs
          .map((e: any) => (e.field ? `${e.field}: ${e.message}` : e.message))
          .join(', ');
        return next(ApiError.badRequest(`Validation error: ${reason}`, errs));
      }
      next(error);
    }
  };
};

export default validate;
