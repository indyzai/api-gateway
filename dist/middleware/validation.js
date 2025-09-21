"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = exports.schemas = exports.validate = void 0;
const joi_1 = __importDefault(require("joi"));
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const validate = (schema) => {
    return (req, res, next) => {
        const requestId = req.headers['x-request-id'];
        const errors = {};
        if (schema.body) {
            const { error } = schema.body.validate(req.body, { abortEarly: false });
            if (error) {
                errors.body = error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                }));
            }
        }
        if (schema.query) {
            const { error } = schema.query.validate(req.query, { abortEarly: false });
            if (error) {
                errors.query = error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                }));
            }
        }
        if (schema.params) {
            const { error } = schema.params.validate(req.params, {
                abortEarly: false,
            });
            if (error) {
                errors.params = error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                }));
            }
        }
        if (Object.keys(errors).length > 0) {
            logger_1.logger.warn('Validation failed', {
                requestId,
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
                errors,
            });
            (0, response_1.sendValidationError)(res, errors, requestId);
            return;
        }
        next();
    };
};
exports.validate = validate;
const pagination = {
    query: joi_1.default.object({
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(10),
        sort: joi_1.default.string().valid('asc', 'desc').default('desc'),
        sortBy: joi_1.default.string().default('createdAt'),
    }),
};
exports.schemas = {
    login: {
        body: joi_1.default.object({
            email: joi_1.default.string().email().required().messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required',
            }),
            password: joi_1.default.string().min(6).required().messages({
                'string.min': 'Password must be at least 6 characters long',
                'any.required': 'Password is required',
            }),
        }),
    },
    register: {
        body: joi_1.default.object({
            email: joi_1.default.string().email().required().messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required',
            }),
            password: joi_1.default.string()
                .min(8)
                .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
                .required()
                .messages({
                'string.min': 'Password must be at least 8 characters long',
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                'any.required': 'Password is required',
            }),
            role: joi_1.default.string().valid('user', 'admin', 'moderator').default('user'),
        }),
    },
    idParam: {
        params: joi_1.default.object({
            id: joi_1.default.string().uuid().required().messages({
                'string.guid': 'Invalid ID format',
                'any.required': 'ID is required',
            }),
        }),
    },
    pagination: pagination,
    search: {
        query: joi_1.default.object({
            q: joi_1.default.string().min(1).max(100).required().messages({
                'string.min': 'Search query must be at least 1 character long',
                'string.max': 'Search query must not exceed 100 characters',
                'any.required': 'Search query is required',
            }),
            ...pagination.query.describe().keys,
        }),
    },
};
const sanitizeInput = (req, res, next) => {
    const sanitizeObject = (obj) => {
        if (typeof obj === 'string') {
            return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
        if (typeof obj === 'object' && obj !== null) {
            const sanitized = {};
            for (const key in obj) {
                sanitized[key] = sanitizeObject(obj[key]);
            }
            return sanitized;
        }
        return obj;
    };
    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);
    next();
};
exports.sanitizeInput = sanitizeInput;
//# sourceMappingURL=validation.js.map