"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = __importDefault(require("./auth"));
const proxy_1 = __importDefault(require("./proxy"));
const admin_1 = __importDefault(require("./admin"));
const health_1 = __importDefault(require("./health"));
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    const requestId = req.headers['x-request-id'];
    const welcomeData = {
        name: 'IndyzAI API Gateway',
        version: '1.0.0',
        description: 'TypeScript-based API Gateway with authentication, rate limiting, and proxy capabilities',
        endpoints: {
            auth: '/api/auth',
            proxy: '/api/proxy',
            admin: '/api/admin',
            health: '/api/health',
        },
        documentation: 'https://docs.indyzai.com/api-gateway',
        timestamp: new Date().toISOString(),
    };
    (0, response_1.sendSuccess)(res, 'Welcome to IndyzAI API Gateway', welcomeData, 200, requestId);
});
router.use('/auth', auth_1.default);
router.use('/proxy', proxy_1.default);
router.use('/admin', admin_1.default);
router.use('/health', health_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map