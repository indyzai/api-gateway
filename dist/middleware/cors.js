"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePreflight = exports.corsMiddleware = void 0;
const cors_1 = __importDefault(require("cors"));
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../utils/logger");
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }
        const allowedOrigins = Array.isArray(config_1.default.cors.origin) ? config_1.default.cors.origin : [config_1.default.cors.origin];
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        }
        else {
            logger_1.logger.warn('CORS blocked request', { origin });
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: config_1.default.cors.credentials,
    optionsSuccessStatus: config_1.default.cors.optionsSuccessStatus,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-Request-ID',
        'Cache-Control',
    ],
    exposedHeaders: [
        'X-Request-ID',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
    ],
};
exports.corsMiddleware = (0, cors_1.default)(corsOptions);
const handlePreflight = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
        res.header('Access-Control-Allow-Headers', Array.isArray(corsOptions.allowedHeaders) ? corsOptions.allowedHeaders?.join(',') : corsOptions.allowedHeaders);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400');
        return res.sendStatus(200);
    }
    next();
};
exports.handlePreflight = handlePreflight;
//# sourceMappingURL=cors.js.map