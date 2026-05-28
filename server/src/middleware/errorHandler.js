import * as Sentry from '@sentry/node';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorConverter = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    // Mongoose validation error → 400
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
      error = new ApiError(400, 'Validation Error', errors, err.stack);
      error.isOperational = true;
      // Mongoose bad ObjectId → 400
    } else if (err.name === 'CastError') {
      error = new ApiError(400, `Invalid ${err.path}: ${err.value}`, [], err.stack);
      error.isOperational = true;
      // Mongoose duplicate key → 409
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || 'field';
      error = new ApiError(
        409,
        `Duplicate value for '${field}'`,
        [{ field, message: `Duplicate value` }],
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

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for '${field}'`;
    errors = [{ field, message }];
  }

  // Mongoose bad ObjectId
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
