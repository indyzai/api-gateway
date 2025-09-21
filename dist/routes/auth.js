"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = require("../services/authService");
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/register', rateLimiter_1.authLimiter, (0, validation_1.validate)(validation_1.schemas.register), async (req, res) => {
    const requestId = req.headers['x-request-id'];
    try {
        const userData = req.body;
        const result = await authService_1.authService.register(userData);
        logger_1.logger.info('User registration successful', {
            requestId,
            userId: result.user.id,
            email: result.user.email,
            ip: req.ip,
        });
        (0, response_1.sendSuccess)(res, 'User registered successfully', {
            user: result.user,
            token: result.token,
        }, 201, requestId);
    }
    catch (error) {
        logger_1.logger.error('User registration failed', error, {
            requestId,
            email: req.body.email,
            ip: req.ip,
        });
        (0, response_1.sendError)(res, error.message, 'REGISTRATION_FAILED', 400, requestId);
    }
});
router.post('/login', rateLimiter_1.authLimiter, (0, validation_1.validate)(validation_1.schemas.login), async (req, res) => {
    const requestId = req.headers['x-request-id'];
    try {
        const credentials = req.body;
        const result = await authService_1.authService.login(credentials);
        logger_1.logger.info('User login successful', {
            requestId,
            userId: result.user.id,
            email: result.user.email,
            ip: req.ip,
        });
        (0, response_1.sendSuccess)(res, 'Login successful', {
            user: result.user,
            token: result.token,
        }, 200, requestId);
    }
    catch (error) {
        logger_1.logger.warn('User login failed', {
            requestId,
            email: req.body.email,
            error: error.message,
            ip: req.ip,
        });
        (0, response_1.sendError)(res, error.message, 'LOGIN_FAILED', 401, requestId);
    }
});
router.get('/me', auth_1.authenticateJWT, (req, res) => {
    const requestId = req.headers['x-request-id'];
    (0, response_1.sendSuccess)(res, 'User profile retrieved', req.user, 200, requestId);
});
router.post('/verify', async (req, res) => {
    const requestId = req.headers['x-request-id'];
    const { token } = req.body;
    if (!token) {
        return (0, response_1.sendError)(res, 'Token is required', 'MISSING_TOKEN', 400, requestId);
    }
    try {
        const decoded = authService_1.authService.verifyToken(token);
        const user = authService_1.authService.getUserById(decoded.id);
        if (!user) {
            return (0, response_1.sendError)(res, 'User not found', 'USER_NOT_FOUND', 404, requestId);
        }
        return (0, response_1.sendSuccess)(res, 'Token is valid', { user, decoded }, 200, requestId);
    }
    catch (error) {
        logger_1.logger.warn('Token verification failed', {
            requestId,
            error: error.message,
            ip: req.ip,
        });
        return (0, response_1.sendError)(res, 'Invalid token', 'INVALID_TOKEN', 401, requestId);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map