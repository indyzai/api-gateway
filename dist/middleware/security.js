"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestSizeLimit = exports.ipWhitelist = exports.requestLogger = exports.requestId = exports.securityHeaders = void 0;
const helmet_1 = __importDefault(require("helmet"));
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
});
const requestId = (req, res, next) => {
    const id = req.headers['x-request-id'] || (0, uuid_1.v4)();
    req.headers['x-request-id'] = id;
    res.setHeader('X-Request-ID', id);
    next();
};
exports.requestId = requestId;
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'];
    logger_1.logger.info('Incoming request', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
    });
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const responseTime = Date.now() - startTime;
        logger_1.logger.info('Request completed', {
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip,
        });
        return originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.requestLogger = requestLogger;
const ipWhitelist = (allowedIPs) => {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress || '';
        if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
            logger_1.logger.warn('IP not whitelisted', {
                requestId: req.headers['x-request-id'],
                ip: clientIP,
                method: req.method,
                url: req.originalUrl,
            });
            res.status(403).json({
                success: false,
                message: 'Access denied',
                error: 'IP_NOT_WHITELISTED',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        next();
    };
};
exports.ipWhitelist = ipWhitelist;
const requestSizeLimit = (maxSize = '10mb') => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'] || '0');
        const maxBytes = parseSize(maxSize);
        if (contentLength > maxBytes) {
            logger_1.logger.warn('Request size exceeded', {
                requestId: req.headers['x-request-id'],
                contentLength,
                maxSize,
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
            });
            res.status(413).json({
                success: false,
                message: 'Request entity too large',
                error: 'REQUEST_TOO_LARGE',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        next();
    };
};
exports.requestSizeLimit = requestSizeLimit;
function parseSize(size) {
    const units = {
        b: 1,
        kb: 1024,
        mb: 1024 * 1024,
        gb: 1024 * 1024 * 1024,
    };
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
    if (!match)
        return 0;
    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';
    return Math.floor(value * units[unit]);
}
//# sourceMappingURL=security.js.map