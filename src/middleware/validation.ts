import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { sendValidationError } from '../utils/response';
import { ValidationSchema } from '../types';
import { logger } from '../utils/logger';

/**
 * Generic validation middleware
 */
export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = req.headers['x-request-id'] as string;
    const errors: any = {};

    // Validate body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        errors.body = error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        errors.query = error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));
      }
    }

    // Validate path parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params, {
        abortEarly: false,
      });
      if (error) {
        errors.params = error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));
      }
    }

    if (Object.keys(errors).length > 0) {
      logger.warn('Validation failed', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        errors,
      });

      sendValidationError(res, errors, requestId);
      return;
    }

    next();
  };
};

const pagination = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
    sortBy: Joi.string().default('createdAt'),
  }),
};

/**
 * Common validation schemas
 */
export const schemas: any = {
  // Authentication schemas
  login: {
    body: Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
      password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required',
      }),
    }),
  },

  register: {
    body: Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
      password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
        .messages({
          'string.min': 'Password must be at least 8 characters long',
          'string.pattern.base':
            'Password must contain at least one uppercase letter, one lowercase letter, and one number',
          'any.required': 'Password is required',
        }),
      role: Joi.string().valid('user', 'admin', 'moderator').default('user'),
    }),
  },

  // Common parameter schemas
  idParam: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.guid': 'Invalid ID format',
        'any.required': 'ID is required',
      }),
    }),
  },

  // Pagination schema
  pagination: pagination,

  // Search schema
  search: {
    query: Joi.object({
      q: Joi.string().min(1).max(100).required().messages({
        'string.min': 'Search query must be at least 1 character long',
        'string.max': 'Search query must not exceed 100 characters',
        'any.required': 'Search query is required',
      }),
      ...pagination.query.describe().keys,
    }),
  },
};

/**
 * Sanitize input middleware
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Remove any potential XSS attempts
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        ''
      );
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);

  next();
};
