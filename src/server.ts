import express from 'express';
import morgan from 'morgan';
import config from './config';
import { corsMiddleware, handlePreflight } from './middleware/cors';
import { securityHeaders, requestId, requestLogger } from './middleware/security';
import { generalLimiter } from './middleware/rateLimiter';
import { sanitizeInput } from './middleware/validation';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';
import { logger } from './utils/logger';

/**
 * Create Express application
 */
const app = express();

/**
 * Trust proxy for accurate IP addresses
 */
app.set('trust proxy', true);

/**
 * Global middleware stack
 */
app.use(requestId);
app.use(requestLogger);
app.use(securityHeaders);
app.use(handlePreflight);
app.use(corsMiddleware);
app.use(morgan(config.logging.format));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);
app.use(generalLimiter);

/**
 * API routes
 */
app.use('/api', routes);

/**
 * Health check endpoint (outside of rate limiting)
 */
app.get('/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'pong', 
    timestamp: new Date().toISOString() 
  });
});

/**
 * Error handling middleware
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Start server
 */
const PORT = config.port;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info('IndyzAI API Gateway started', {
      port: PORT,
      environment: JSON.stringify(config.nodeEnv),
      version: '1.0.0',
    });
  });
}

export default app;