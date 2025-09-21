import { Router } from 'express';
import { proxyService } from '../services/proxyService';
import { authenticateJWT, optionalAuth } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { sendError, sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /proxy/services
 * Get list of available services
 */
router.get('/services',
  authenticateJWT,
  (req: AuthenticatedRequest, res) => {
    const requestId = req.headers['x-request-id'] as string;
    const services = proxyService.getServices();
    
    sendSuccess(res, 'Services retrieved', services, 200, requestId);
  }
);

/**
 * Proxy routes for User Service
 * GET /proxy/users/*
 */
router.use('/users',
  apiLimiter,
  optionalAuth,
  proxyService.createProxy('users', {
    '^/proxy/users': '',
  })
);

/**
 * Direct proxy handler for users
 */
router.get('/users/:id',
  apiLimiter,
  optionalAuth,
  async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    await proxyService.handleProxiedRequest(req, res, 'users', `/users/${id}`, 'GET');
  }
);

/**
 * Proxy routes for Payment Service (requires authentication)
 * POST /proxy/payments/*
 */
router.use('/payments',
  apiLimiter,
  authenticateJWT,
  proxyService.createProxy('payments', {
    '^/proxy/payments': '/v1',
  })
);

/**
 * Direct payment processing
 */
router.post('/payments/charge',
  apiLimiter,
  authenticateJWT,
  async (req: AuthenticatedRequest, res) => {
    const requestId = req.headers['x-request-id'] as string;
    
    try {
      // Add user context to payment request
      const paymentData = {
        ...req.body,
        customer_id: req.user?.id,
        metadata: {
          user_id: req.user?.id,
          user_email: req.user?.email,
          ...req.body.metadata,
        },
      };

      await proxyService.handleProxiedRequest(
        { ...req, body: paymentData } as any,
        res,
        'payments',
        '/v1/charges',
        'POST'
      );
    } catch (error: any) {
      logger.error('Payment processing failed', error, {
        requestId,
        userId: req.user?.id,
        ip: req.ip,
      });
      
      sendError(res, 'Payment processing failed', 'PAYMENT_ERROR', 500, requestId);
    }
  }
);

/**
 * Proxy routes for Notification Service
 * POST /proxy/notifications/*
 */
router.use('/notifications',
  apiLimiter,
  authenticateJWT,
  proxyService.createProxy('notifications', {
    '^/proxy/notifications': '/v3',
  })
);

/**
 * Send notification with user context
 */
router.post('/notifications/send',
  apiLimiter,
  authenticateJWT,
  async (req: AuthenticatedRequest, res) => {
    const requestId = req.headers['x-request-id'] as string;
    
    try {
      // Add user context to notification
      const notificationData = {
        ...req.body,
        from: req.body.from || 'noreply@indyzai.com',
        personalizations: [{
          to: [{ email: req.user?.email }],
          subject: req.body.subject,
          ...req.body.personalizations?.[0],
        }],
      };

      await proxyService.handleProxiedRequest(
        { ...req, body: notificationData } as any,
        res,
        'notifications',
        '/v3/mail/send',
        'POST'
      );
    } catch (error: any) {
      logger.error('Notification sending failed', error, {
        requestId,
        userId: req.user?.id,
        ip: req.ip,
      });
      
      sendError(res, 'Notification sending failed', 'NOTIFICATION_ERROR', 500, requestId);
    }
  }
);

/**
 * Generic proxy handler for custom services
 * ALL /proxy/:service/*
 */
router.all('/:service/*',
  apiLimiter,
  authenticateJWT,
  async (req: AuthenticatedRequest, res) => {
    const { service } = req.params;
    const path = req.originalUrl.replace(`/api/proxy/${service}`, '');
    const requestId = req.headers['x-request-id'] as string;
    
    try {
      await proxyService.handleProxiedRequest(
        req,
        res,
        service,
        path,
        req.method as any
      );
    } catch (error: any) {
      logger.error(`Proxy request to ${service} failed`, error, {
        requestId,
        service,
        path,
        method: req.method,
        userId: req.user?.id,
        ip: req.ip,
      });
      
      sendError(res, `Service '${service}' unavailable`, 'SERVICE_UNAVAILABLE', 502, requestId);
    }
  }
);

export default router;