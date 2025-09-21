"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = void 0;
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const config_1 = __importDefault(require("../config"));
const errorHandler = (error, req, res, next) => {
    const requestId = req.headers['x-request-id'];
    logger_1.logger.error('Unhandled error', error, {
        requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
    });
    let statusCode = 500;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
        errorCode = 'VALIDATION_ERROR';
    }
    else if (error.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized';
        errorCode = 'UNAUTHORIZED';
    }
    else if (error.name === 'ForbiddenError') {
        statusCode = 403;
        message = 'Forbidden';
        errorCode = 'FORBIDDEN';
    }
    else if (error.name === 'NotFoundError') {
        statusCode = 404;
        message = 'Not found';
        errorCode = 'NOT_FOUND';
    }
    else if (error.code === 'ECONNREFUSED') {
        statusCode = 502;
        message = 'Service unavailable';
        errorCode = 'SERVICE_UNAVAILABLE';
    }
    else if (error.code === 'ETIMEDOUT') {
        statusCode = 504;
        message = 'Gateway timeout';
        errorCode = 'GATEWAY_TIMEOUT';
    }
    const errorResponse = (0, response_1.createErrorResponse)(message, errorCode, requestId, config_1.default.nodeEnv === 'development' ? error.stack : undefined);
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    const requestId = req.headers['x-request-id'];
    logger_1.logger.warn('Route not found', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    });
    const errorResponse = (0, response_1.createErrorResponse)('Route not found', 'ROUTE_NOT_FOUND', requestId);
    res.status(404).json(errorResponse);
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map