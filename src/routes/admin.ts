import { Router } from 'express';
import { authenticateJWT, authorize } from '../middleware/auth';
import { strictLimiter } from '../middleware/rateLimiter';
import { validate, schemas } from '../middleware/validation';
import { authService } from '../services/authService';
import { proxyService } from '../services/proxyService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest, ServiceConfig } from '../types';
import { logger } from '../utils/logger';
import Joi from 'joi';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateJWT);
router.use(authorize(['admin']));
router.use(strictLimiter);

/**
 * GET /admin/users
 * Get all users
 */
router.get('/users', (req: AuthenticatedRequest, res) => {
  const requestId = req.headers['x-request-id'] as string;
  const users = authService.getAllUsers();
  
  logger.info('Admin retrieved all users', {
    requestId,
    adminId: req.user?.id,
    userCount: users.length,
  });
  
  return sendSuccess(res, 'Users retrieved', users, 200, requestId);
});

/**
 * GET /admin/users/:id
 * Get user by ID
 */
router.get('/users/:id',
  validate(schemas.idParam),
  (req: AuthenticatedRequest, res) => {
    const requestId = req.headers['x-request-id'] as string;
    const { id } = req.params;
    const user = authService.getUserById(id);
    
    if (!user) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', 404, requestId);
    }
    
    return sendSuccess(res, 'User retrieved', user, 200, requestId);
  }
);

/**
 * PUT /admin/users/:id/permissions
 * Update user permissions
 */
router.put('/users/:id/permissions',
  validate({
    params: schemas.idParam.params,
    body: Joi.object({
      permissions: Joi.array().items(Joi.string()).required(),
    }),
  }),
  (req: AuthenticatedRequest, res) => {
    const requestId = req.headers['x-request-id'] as string;
    const { id } = req.params;
    const { permissions } = req.body;
    
    const success = authService.updateUserPermissions(id, permissions);
    
    if (!success) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', 404, requestId);
    }
    
    logger.info('Admin updated user permissions', {
      requestId,
      adminId: req.user?.id,
      targetUserId: id,
      permissions,
    });
    
    return sendSuccess(res, 'User permissions updated', null, 200, requestId);
  }
);

/**
 * DELETE /admin/users/:id
 * Delete user
 */
router.delete('/users/:id',
  validate(schemas.idParam),
  (req: AuthenticatedRequest, res) => {
    const requestId = req.headers['x-request-id'] as string;
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (id === req.user?.id) {
      return sendError(res, 'Cannot delete your own account', 'SELF_DELETE_FORBIDDEN', 400, requestId);
    }
    
    const success = authService.deleteUser(id);
    
    if (!success) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', 404, requestId);
    }
    
    logger.info('Admin deleted user', {
      requestId,
      adminId: req.user?.id,
      deletedUserId: id,
    });
    
    return sendSuccess(res, 'User deleted', null, 200, requestId);
  }
);

/**
 * GET /admin/services
 * Get all registered services
 */
router.get('/services', (req: AuthenticatedRequest, res) => {
  const requestId = req.headers['x-request-id'] as string;
  const services = proxyService.getServices();
  
  return sendSuccess(res, 'Services retrieved', services, 200, requestId);
});

/**
 * POST /admin/services
 * Add new service
 */
router.post('/services',
  validate({
    body: Joi.object({
      name: Joi.string().required(),
      baseUrl: Joi.string().uri().required(),
      timeout: Joi.number().integer().min(1000).max(60000).default(10000),
      retries: Joi.number().integer().min(0).max(5).default(3),
      headers: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
    }),
  }),
  (req: AuthenticatedRequest, res) => {
    const requestId = req.headers['x-request-id'] as string;
    const { name, ...serviceConfig } = req.body;
    
    const config: ServiceConfig = {
      name: serviceConfig.name || name,
      ...serviceConfig,
    };
    
    proxyService.addService(name, config);
    
    logger.info('Admin added new service', {
      requestId,
      adminId: req.user?.id,
      serviceName: name,
      serviceConfig: config,
    });
    
    return sendSuccess(res, 'Service added', config, 201, requestId);
  }
);

/**
 * DELETE /admin/services/:name
 * Remove service
 */
router.delete('/services/:name', (req: AuthenticatedRequest, res) => {
  const requestId = req.headers['x-request-id'] as string;
  const { name } = req.params;
  
  const success = proxyService.removeService(name);
  
  if (!success) {
    return sendError(res, 'Service not found', 'SERVICE_NOT_FOUND', 404, requestId);
  }
  
  logger.info('Admin removed service', {
    requestId,
    adminId: req.user?.id,
    serviceName: name,
  });
  
  return sendSuccess(res, 'Service removed', null, 200, requestId);
});

/**
 * GET /admin/stats
 * Get system statistics
 */
router.get('/stats', (req: AuthenticatedRequest, res) => {
  const requestId = req.headers['x-request-id'] as string;
  
  const stats = {
    users: {
      total: authService.getAllUsers().length,
      byRole: authService.getAllUsers().reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
    services: {
      total: proxyService.getServices().length,
      list: proxyService.getServices().map(s => ({ name: s.name, baseUrl: s.baseUrl })),
    },
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
    },
  };
  
  return sendSuccess(res, 'System statistics retrieved', stats, 200, requestId);
});

export default router;