import { Response } from 'express';

export class ApiResponse<T = any> {
  public success: boolean;
  public statusCode: number;
  public message: string;
  public data: T;

  constructor(statusCode: number, data: T, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  static ok<T>(res: Response, data: T, message = 'Success'): Response {
    return res.status(200).json(new ApiResponse(200, data, message));
  }

  static created<T>(res: Response, data: T, message = 'Created successfully'): Response {
    return res.status(201).json(new ApiResponse(201, data, message));
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static paginated<T>(
    res: Response,
    payload: {
      docs: T[];
      page: number | string;
      limit: number | string;
      total: number;
      [key: string]: any;
    }
  ): Response {
    const pageNum = parseInt(payload.page as string);
    const limitNum = parseInt(payload.limit as string);
    const { docs, total, ...extra } = payload;

    return res.status(200).json({
      success: true,
      message: 'Success',
      data: docs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
      ...extra,
    });
  }
}
