import cors from 'cors';
import { Request } from 'express';
import config from '../config';
import { logger } from '../utils/logger';

/**
 * Dynamic CORS configuration
 */
const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins: string[] = Array.isArray(config.cors.origin) ? config.cors.origin : [config.cors.origin];
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: config.cors.credentials,
  optionsSuccessStatus: config.cors.optionsSuccessStatus,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Request-ID',
    'Cache-Control',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
};

export const corsMiddleware = cors(corsOptions);

/**
 * Preflight handler for complex CORS requests
 */
export const handlePreflight = (req: Request, res: any, next: any) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', Array.isArray(corsOptions.allowedHeaders) ? corsOptions.allowedHeaders?.join(',') : corsOptions.allowedHeaders);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    return res.sendStatus(200);
  }
  next();
};