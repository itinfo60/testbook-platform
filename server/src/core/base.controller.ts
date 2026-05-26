import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from './api-response.js';

export abstract class BaseController {
  protected catchAsync(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | any
  ): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  protected ok<T>(res: Response, data: T, message?: string): Response {
    return ApiResponse.ok(res, data, message);
  }

  protected created<T>(res: Response, data: T, message?: string): Response {
    return ApiResponse.created(res, data, message);
  }

  protected noContent(res: Response): Response {
    return ApiResponse.noContent(res);
  }

  protected paginated<T>(
    res: Response,
    payload: {
      docs: T[];
      page: number | string;
      limit: number | string;
      total: number;
      [key: string]: any;
    }
  ): Response {
    return ApiResponse.paginated(res, payload);
  }
}
