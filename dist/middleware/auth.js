"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.authorize = exports.optionalAuth = exports.authenticateAPIKey = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers[config_1.default.security.authHeader];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        (0, response_1.sendError)(res, 'Access token required', 'MISSING_TOKEN', 401);
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            permissions: decoded.permissions,
        };
        logger_1.logger.debug('JWT authentication successful', {
            requestId: req.headers['x-request-id'],
            userId: req.user.id,
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
        });
        next();
    }
    catch (error) {
        const errorCode = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
        logger_1.logger.warn('JWT authentication failed', {
            requestId: req.headers['x-request-id'],
            error: error.message,
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
        });
        (0, response_1.sendError)(res, 'Invalid or expired token', errorCode, 403);
    }
};
exports.authenticateJWT = authenticateJWT;
const authenticateAPIKey = (req, res, next) => {
    const apiKey = req.headers[config_1.default.security.apiKeyHeader];
    if (!apiKey) {
        (0, response_1.sendError)(res, 'API key required', 'MISSING_API_KEY', 401);
        return;
    }
    if (apiKey !== config_1.default.apiKeys.internal) {
        logger_1.logger.warn('Invalid API key attempt', {
            requestId: req.headers['x-request-id'],
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
        });
        (0, response_1.sendError)(res, 'Invalid API key', 'INVALID_API_KEY', 403);
        return;
    }
    logger_1.logger.debug('API key authentication successful', {
        requestId: req.headers['x-request-id'],
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    });
    next();
};
exports.authenticateAPIKey = authenticateAPIKey;
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers[config_1.default.security.authHeader];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                permissions: decoded.permissions,
            };
        }
        catch (error) {
            logger_1.logger.debug('Optional auth failed, continuing without user', {
                requestId: req.headers['x-request-id'],
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
            });
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 'AUTH_REQUIRED', 401);
            return;
        }
        if (roles.length && !roles.includes(req.user.role)) {
            logger_1.logger.warn('Insufficient permissions', {
                requestId: req.headers['x-request-id'],
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: roles,
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
            });
            (0, response_1.sendError)(res, 'Insufficient permissions', 'INSUFFICIENT_PERMISSIONS', 403);
            return;
        }
        next();
    };
};
exports.authorize = authorize;
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 'AUTH_REQUIRED', 401);
            return;
        }
        if (!req.user.permissions || !req.user.permissions.includes(permission)) {
            logger_1.logger.warn('Missing required permission', {
                requestId: req.headers['x-request-id'],
                userId: req.user.id,
                requiredPermission: permission,
                userPermissions: req.user.permissions,
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
            });
            (0, response_1.sendError)(res, 'Missing required permission', 'MISSING_PERMISSION', 403);
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
//# sourceMappingURL=auth.js.map