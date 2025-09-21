import { Router } from 'express';
import { sendSuccess } from '../utils/response';
import authRoutes from './auth';
import proxyRoutes from './proxy';
import adminRoutes from './admin';
import healthRoutes from './health';

const router = Router();

/**
 * GET /
 * API Gateway welcome message
 */
router.get('/', (req, res) => {
  const requestId = req.headers['x-request-id'] as string;
  
  const welcomeData = {
    name: 'IndyzAI API Gateway',
    version: '1.0.0',
    description: 'TypeScript-based API Gateway with authentication, rate limiting, and proxy capabilities',
    endpoints: {
      auth: '/api/auth',
      proxy: '/api/proxy',
      admin: '/api/admin',
      health: '/api/health',
    },
    documentation: 'https://docs.indyzai.com/api-gateway',
    timestamp: new Date().toISOString(),
  };
  
  sendSuccess(res, 'Welcome to IndyzAI API Gateway', welcomeData, 200, requestId);
});

/**
 * Mount route modules
 */
router.use('/auth', authRoutes);
router.use('/proxy', proxyRoutes);
router.use('/admin', adminRoutes);
router.use('/health', healthRoutes);

export default router;