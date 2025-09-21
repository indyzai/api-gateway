import { Router } from 'express';
import { authService } from '../services/authService';
import { validate, schemas } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import { sendSuccess, sendError } from '../utils/response';
import { LoginRequest, RegisterRequest, AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

/**
 * POST /auth/register
 * Register a new user
 */
router.post(
  '/register',
  authLimiter,
  validate(schemas.register),
  async (req, res) => {
    const requestId = req.headers['x-request-id'] as string;

    try {
      const userData: RegisterRequest = req.body;
      const result = await authService.register(userData);

      logger.info('User registration successful', {
        requestId,
        userId: result.user.id,
        email: result.user.email,
        ip: req.ip,
      });

      sendSuccess(
        res,
        'User registered successfully',
        {
          user: result.user,
          token: result.token,
        },
        201,
        requestId
      );
    } catch (error: any) {
      logger.error('User registration failed', error, {
        requestId,
        email: req.body.email,
        ip: req.ip,
      });

      sendError(res, error.message, 'REGISTRATION_FAILED', 400, requestId);
    }
  }
);

/**
 * POST /auth/login
 * Login user
 */
router.post(
  '/login',
  authLimiter,
  validate(schemas.login),
  async (req, res) => {
    const requestId = req.headers['x-request-id'] as string;

    try {
      const credentials: LoginRequest = req.body;
      const result = await authService.login(credentials);

      logger.info('User login successful', {
        requestId,
        userId: result.user.id,
        email: result.user.email,
        ip: req.ip,
      });

      sendSuccess(
        res,
        'Login successful',
        {
          user: result.user,
          token: result.token,
        },
        200,
        requestId
      );
    } catch (error: any) {
      logger.warn('User login failed', {
        requestId,
        email: req.body.email,
        error: error.message,
        ip: req.ip,
      });

      sendError(res, error.message, 'LOGIN_FAILED', 401, requestId);
    }
  }
);

/**
 * GET /auth/me
 * Get current user profile
 */
router.get('/me', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const requestId = req.headers['x-request-id'] as string;

  sendSuccess(res, 'User profile retrieved', req.user, 200, requestId);
});

/**
 * POST /auth/verify
 * Verify JWT token
 */
router.post('/verify', async (req, res) => {
  const requestId = req.headers['x-request-id'] as string;
  const { token } = req.body;

  if (!token) {
    return sendError(res, 'Token is required', 'MISSING_TOKEN', 400, requestId);
  }

  try {
    const decoded = authService.verifyToken(token);
    const user = authService.getUserById(decoded.id);

    if (!user) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', 404, requestId);
    }

    return sendSuccess(
      res,
      'Token is valid',
      { user, decoded },
      200,
      requestId
    );
  } catch (error: any) {
    logger.warn('Token verification failed', {
      requestId,
      error: error.message,
      ip: req.ip,
    });

    return sendError(res, 'Invalid token', 'INVALID_TOKEN', 401, requestId);
  }
});

export default router;
