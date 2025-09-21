import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import express from 'express';
import serverlessHttp from 'serverless-http';

// Import the app configuration
import '../../src/server';

// Create a simple Express app for Netlify
const app = express();

// Import and use all the middleware and routes from the main server
import routes from '../../src/routes';
import { corsMiddleware, handlePreflight } from '../../src/middleware/cors';
import { securityHeaders, requestId, requestLogger } from '../../src/middleware/security';
import { generalLimiter } from '../../src/middleware/rateLimiter';
import { sanitizeInput } from '../../src/middleware/validation';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler';
import morgan from 'morgan';
import config from '../../src/config';

// Setup middleware
app.set('trust proxy', true);
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

// API routes
app.use('/api', routes);

// Health check
app.get('/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'pong', 
    timestamp: new Date().toISOString() 
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Netlify Functions handler for the API Gateway
 */
const handler: Handler = serverlessHttp(app);

export { handler };