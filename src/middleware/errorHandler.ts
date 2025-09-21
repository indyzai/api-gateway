import { Request, Response, NextFunction } from 'express';
import { createErrorResponse } from '../utils/response';
import { logger } from '../utils/logger';
import config from '../config';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string;
  
  // Log the error
  logger.error('Unhandled error', error, {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    errorCode = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
    errorCode = 'UNAUTHORIZED';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
    errorCode = 'FORBIDDEN';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Not found';
    errorCode = 'NOT_FOUND';
  } else if (error.code === 'ECONNREFUSED') {
    statusCode = 502;
    message = 'Service unavailable';
    errorCode = 'SERVICE_UNAVAILABLE';
  } else if (error.code === 'ETIMEDOUT') {
    statusCode = 504;
    message = 'Gateway timeout';
    errorCode = 'GATEWAY_TIMEOUT';
  }

  // Create error response
  const errorResponse = createErrorResponse(
    message,
    errorCode,
    requestId,
    config.nodeEnv === 'development' ? error.stack : undefined
  );

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const requestId = req.headers['x-request-id'] as string;
  
  logger.warn('Route not found', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  const errorResponse = createErrorResponse(
    'Route not found',
    'ROUTE_NOT_FOUND',
    requestId
  );

  res.status(404).json(errorResponse);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};