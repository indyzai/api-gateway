import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, ErrorResponse } from '../types';

/**
 * Create a standardized API response
 */
export const createResponse = <T = any>(
  success: boolean,
  message: string,
  data?: T,
  error?: string,
  requestId?: string
): ApiResponse<T> => {
  return {
    success,
    message,
    data,
    error,
    timestamp: new Date().toISOString(),
    requestId: requestId || uuidv4(),
  };
};

/**
 * Send success response
 */
export const sendSuccess = <T = any>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200,
  requestId?: string
): Response => {
  return res.status(statusCode).json(createResponse(true, message, data, undefined, requestId));
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  message: string,
  error?: string,
  statusCode: number = 400,
  requestId?: string
): Response => {
  return res.status(statusCode).json(createResponse(false, message, undefined, error, requestId));
};

/**
 * Send validation error response
 */
export const sendValidationError = (
  res: Response,
  errors: any,
  requestId?: string
): Response => {
  return res.status(422).json(createResponse(
    false,
    'Validation failed',
    undefined,
    errors,
    requestId
  ));
};

/**
 * Create error response object
 */
export const createErrorResponse = (
  message: string,
  error: string,
  requestId?: string,
  stack?: string
): ErrorResponse => {
  return {
    success: false,
    message,
    error,
    timestamp: new Date().toISOString(),
    requestId: requestId || uuidv4(),
    ...(stack && { stack }),
  };
};