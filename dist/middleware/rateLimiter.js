"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimiter = exports.apiLimiter = exports.authLimiter = exports.strictLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = __importDefault(require("../config"));
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const keyGenerator = (req) => {
    const authReq = req;
    return authReq.user?.id || req.ip || 'unknown';
};
const rateLimitHandler = (req, res) => {
    const requestId = req.headers['x-request-id'];
    logger_1.logger.warn('Rate limit exceeded', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: req.user?.id,
    });
    return res.status(429).json((0, response_1.createResponse)(false, 'Rate limit exceeded', null, 'RATE_LIMIT_EXCEEDED', requestId));
};
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.default.rateLimit.windowMs,
    max: config_1.default.rateLimit.maxRequests,
    message: (0, response_1.createResponse)(false, config_1.default.rateLimit.message, null, 'RATE_LIMIT_EXCEEDED'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: rateLimitHandler,
});
exports.strictLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: (0, response_1.createResponse)(false, 'Too many attempts, please try again later', null, 'STRICT_RATE_LIMIT_EXCEEDED'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: rateLimitHandler,
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: (0, response_1.createResponse)(false, 'Too many authentication attempts', null, 'AUTH_RATE_LIMIT_EXCEEDED'),
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator,
    handler: rateLimitHandler,
});
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 30,
    message: (0, response_1.createResponse)(false, 'API rate limit exceeded', null, 'API_RATE_LIMIT_EXCEEDED'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: rateLimitHandler,
});
const createRateLimiter = (windowMs, max, message) => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max,
        message: (0, response_1.createResponse)(false, message, null, 'CUSTOM_RATE_LIMIT_EXCEEDED'),
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator,
        handler: rateLimitHandler,
    });
};
exports.createRateLimiter = createRateLimiter;
//# sourceMappingURL=rateLimiter.js.map