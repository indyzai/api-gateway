import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { sendError } from '../utils/response';
import { AuthenticatedRequest, User, JWTPayload } from '../types';
import { logger } from '../utils/logger';

/**
 * JWT Authentication Middleware
 */
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers[config.security.authHeader] as string;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    sendError(res, 'Access token required', 'MISSING_TOKEN', 401);
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions,
    };
    
    logger.debug('JWT authentication successful', {
      requestId: req.headers['x-request-id'] as string,
      userId: req.user.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
    
    next();
  } catch (error: any) {
    const errorCode = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    logger.warn('JWT authentication failed', {
      requestId: req.headers['x-request-id'] as string,
      error: error.message,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
    
    sendError(res, 'Invalid or expired token', errorCode, 403);
  }
};

/**
 * API Key Authentication Middleware
 */
export const authenticateAPIKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers[config.security.apiKeyHeader] as string;
  
  if (!apiKey) {
    sendError(res, 'API key required', 'MISSING_API_KEY', 401);
    return;
  }
  
  // In production, validate against a database or secure store
  if (apiKey !== config.apiKeys.internal) {
    logger.warn('Invalid API key attempt', {
      requestId: req.headers['x-request-id'] as string,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
    
    sendError(res, 'Invalid API key', 'INVALID_API_KEY', 403);
    return;
  }
  
  logger.debug('API key authentication successful', {
    requestId: req.headers['x-request-id'] as string,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });
  
  next();
};

/**
 * Optional JWT Authentication (doesn't fail if no token)
 */
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers[config.security.authHeader] as string;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions,
      };
    } catch (error) {
      // Silently fail for optional auth
      logger.debug('Optional auth failed, continuing without user', {
        requestId: req.headers['x-request-id'] as string,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      });
    }
  }
  
  next();
};

/**
 * Role-based Authorization Middleware
 */
export const authorize = (roles: string[] = []) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 'AUTH_REQUIRED', 401);
      return;
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      logger.warn('Insufficient permissions', {
        requestId: req.headers['x-request-id'] as string,
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      });
      
      sendError(res, 'Insufficient permissions', 'INSUFFICIENT_PERMISSIONS', 403);
      return;
    }
    
    next();
  };
};

/**
 * Permission-based Authorization Middleware
 */
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 'AUTH_REQUIRED', 401);
      return;
    }
    
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      logger.warn('Missing required permission', {
        requestId: req.headers['x-request-id'] as string,
        userId: req.user.id,
        requiredPermission: permission,
        userPermissions: req.user.permissions,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      });
      
      sendError(res, 'Missing required permission', 'MISSING_PERMISSION', 403);
      return;
    }
    
    next();
  };
};