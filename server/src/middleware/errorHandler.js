import * as Sentry from '@sentry/node';
import { Prisma } from '@prisma/client';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorConverter = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError ||
      err.name === 'PrismaClientKnownRequestError'
    ) {
      if (err.code === 'P2002') {
        const target = err.meta?.target;
        const field = Array.isArray(target) ? target.join(', ') : target || 'field';
        error = new ApiError(
          409,
          `Duplicate value for '${field}'`,
          [{ field, message: `Duplicate value for '${field}'` }],
          err.stack
        );
        error.isOperational = true;
      } else if (err.code === 'P2025') {
        const message = err.meta?.cause || 'Record not found';
        error = new ApiError(404, String(message), [], err.stack);
        error.isOperational = true;
      } else if (err.code === 'P2003') {
        const field = err.meta?.field_name || 'relation';
        error = new ApiError(400, `Invalid relation reference: ${field}`, [], err.stack);
        error.isOperational = true;
      } else if (err.code === 'P2000') {
        error = new ApiError(400, 'Provided value exceeds maximum length', [], err.stack);
        error.isOperational = true;
      } else {
        error = new ApiError(400, `Database error: ${err.message}`, [], err.stack);
        error.isOperational = true;
      }
    } else if (
      err instanceof Prisma.PrismaClientValidationError ||
      err.name === 'PrismaClientValidationError'
    ) {
      error = new ApiError(400, 'Database validation error: Invalid input data', [], err.stack);
      error.isOperational = true;
    } else if (
      err instanceof Prisma.PrismaClientInitializationError ||
      err.name === 'PrismaClientInitializationError'
    ) {
      error = new ApiError(503, 'Database service temporarily unavailable', [], err.stack);
      error.isOperational = false;
    } else if (err.name === 'ValidationError' && err.errors) {
      const errors = Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      error = new ApiError(400, 'Validation Error', errors, err.stack);
      error.isOperational = true;
    } else if (err.name === 'CastError') {
      error = new ApiError(400, `Invalid ${err.path}: ${err.value}`, [], err.stack);
      error.isOperational = true;
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || 'field';
      error = new ApiError(
        409,
        `Duplicate value for '${field}'`,
        [{ field, message: `Duplicate value for '${field}'` }],
        err.stack
      );
      error.isOperational = true;
    } else {
      const statusCode = error.statusCode || error.status || 500;
      const message = error.message || 'Internal Server Error';
      error = new ApiError(statusCode, message, [], err.stack);
      error.isOperational = false;
    }
  }

  next(error);
};

export const errorHandler = (err, req, res, _next) => {
  let { statusCode, message, errors } = err;

  // Prisma Known Request Error
  if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err.name === 'PrismaClientKnownRequestError'
  ) {
    if (err.code === 'P2002') {
      statusCode = 409;
      const target = err.meta?.target;
      const field = Array.isArray(target) ? target.join(', ') : target || 'field';
      message = `Duplicate value for '${field}'`;
      errors = [{ field, message }];
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = err.meta?.cause || 'Record not found';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      const field = err.meta?.field_name || 'relation';
      message = `Invalid relation reference: ${field}`;
    } else if (err.code === 'P2000') {
      statusCode = 400;
      message = 'Provided value exceeds maximum length';
    }
  }

  // Prisma Validation Error
  if (
    err instanceof Prisma.PrismaClientValidationError ||
    err.name === 'PrismaClientValidationError'
  ) {
    statusCode = 400;
    message = 'Database validation error: Invalid input data';
  }

  // Prisma Initialization Error
  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    err.name === 'PrismaClientInitializationError'
  ) {
    statusCode = 503;
    message = 'Database service temporarily unavailable';
  }

  // Validation errors
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Duplicate key errors
  if (err.code === 11000 && err.keyValue) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0] || 'field';
    message = `Duplicate value for '${field}'`;
    errors = [{ field, message: `Duplicate value for '${field}'` }];
  }

  // Cast errors
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large';
  }

  if (!statusCode) {
    statusCode = 500;
    message = message || 'Internal Server Error';
  }

  const logCtx = {
    requestId: req.id,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.userId || null,
    tenantId: req.tenantId || null,
  };

  if (statusCode >= 500) {
    Sentry.withScope((scope) => {
      scope.setTag('requestId', req.id);
      scope.setUser({ id: req.userId });
      scope.setExtra('url', req.originalUrl);
      scope.setExtra('method', req.method);
      scope.setExtra('tenantId', req.tenantId);
      Sentry.captureException(err);
    });
    logger.error(`${statusCode} - ${message}`, { ...logCtx, stack: err.stack });
  } else if (statusCode >= 400) {
    logger.warn(`${statusCode} - ${message}`, logCtx);
  }

  const response = {
    success: false,
    statusCode,
    message,
    ...(errors?.length && { errors }),
    ...(config.env === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};
