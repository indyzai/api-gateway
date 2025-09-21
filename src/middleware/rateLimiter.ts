import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import config from '../config';
import { createResponse } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';

/**
 * Key generator function for rate limiting
 */
const keyGenerator = (req: Request): string => {
  // Use user ID if authenticated, otherwise use IP
  const authReq = req as AuthenticatedRequest;
  return authReq.user?.id || req.ip || 'unknown';
};

/**
 * Rate limit handler
 */
const rateLimitHandler = (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  
  logger.warn('Rate limit exceeded', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: (req as AuthenticatedRequest).user?.id,
  });

  return res.status(429).json(
    createResponse(false, 'Rate limit exceeded', null, 'RATE_LIMIT_EXCEEDED', requestId)
  );
};

/**
 * General Rate Limiter
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: createResponse(false, config.rateLimit.message, null, 'RATE_LIMIT_EXCEEDED'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
});

/**
 * Strict Rate Limiter for sensitive endpoints
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: createResponse(false, 'Too many attempts, please try again later', null, 'STRICT_RATE_LIMIT_EXCEEDED'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
});

/**
 * Auth Rate Limiter for login/register endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: createResponse(false, 'Too many authentication attempts', null, 'AUTH_RATE_LIMIT_EXCEEDED'),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator,
  handler: rateLimitHandler,
});

/**
 * API Rate Limiter for external API calls
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: createResponse(false, 'API rate limit exceeded', null, 'API_RATE_LIMIT_EXCEEDED'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
});

/**
 * Custom rate limiter factory
 */
export const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: createResponse(false, message, null, 'CUSTOM_RATE_LIMIT_EXCEEDED'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: rateLimitHandler,
  });
};