"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: process.env.JWT_ISSUER || 'IndyzAI-Gateway',
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        message: 'Too many requests from this IP, please try again later.',
    },
    cors: {
        origin: process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',')
            : ['http://localhost:3000', 'http://localhost:5173'],
        credentials: true,
        optionsSuccessStatus: 200,
    },
    services: {
        userService: process.env.USER_SERVICE_URL || 'https://jsonplaceholder.typicode.com',
        paymentService: process.env.PAYMENT_SERVICE_URL || 'https://api.stripe.com',
        notificationService: process.env.NOTIFICATION_SERVICE_URL || 'https://api.sendgrid.com',
    },
    apiKeys: {
        stripe: process.env.STRIPE_API_KEY,
        sendgrid: process.env.SENDGRID_API_KEY,
        internal: process.env.INTERNAL_API_KEY || 'default-internal-key',
    },
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
        apiKeyHeader: 'x-api-key',
        authHeader: 'authorization',
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'combined',
    },
};
exports.default = config;
//# sourceMappingURL=index.js.map