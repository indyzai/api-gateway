import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import { proxyService } from '../services/proxyService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /health
 * Basic health check
 */
router.get('/', (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };
  
  sendSuccess(res, 'Service is healthy', healthData, 200, requestId);
});

/**
 * GET /health/detailed
 * Detailed health check with service status
 */
router.get('/detailed', async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  const services = proxyService.getServices();
  const serviceStatus: Record<string, any> = {};
  
  // Check each service health
  for (const service of services) {
    try {
      const startTime = Date.now();
      // Simple health check - try to reach the service
      await proxyService.makeRequest(service.name.toLowerCase().replace(' ', ''), '/health', 'GET');
      const responseTime = Date.now() - startTime;
      
      serviceStatus[service.name] = {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        url: service.baseUrl,
      };
    } catch (error: any) {
      serviceStatus[service.name] = {
        status: 'unhealthy',
        error: error.message,
        url: service.baseUrl,
      };
    }
  }
  
  const healthData = {
    status: Object.values(serviceStatus).every((s: any) => s.status === 'healthy') ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: serviceStatus,
  };
  
  const statusCode = healthData.status === 'healthy' ? 200 : 503;
  
  logger.info('Detailed health check performed', {
    requestId,
    status: healthData.status,
    serviceCount: services.length,
  });
  
  sendSuccess(res, 'Detailed health check completed', healthData, statusCode, requestId);
});

/**
 * GET /health/ready
 * Readiness probe
 */
router.get('/ready', (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  
  // Check if the application is ready to serve requests
  const isReady = true; // Add your readiness logic here
  
  if (isReady) {
    sendSuccess(res, 'Service is ready', { ready: true }, 200, requestId);
  } else {
    res.status(503).json({
      success: false,
      message: 'Service is not ready',
      data: { ready: false },
      timestamp: new Date().toISOString(),
      requestId,
    });
  }
});

/**
 * GET /health/live
 * Liveness probe
 */
router.get('/live', (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  
  // Simple liveness check
  sendSuccess(res, 'Service is alive', { alive: true }, 200, requestId);
});

export default router;