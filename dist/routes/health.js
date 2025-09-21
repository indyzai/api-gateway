"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const proxyService_1 = require("../services/proxyService");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    const requestId = req.headers['x-request-id'];
    const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    };
    (0, response_1.sendSuccess)(res, 'Service is healthy', healthData, 200, requestId);
});
router.get('/detailed', async (req, res) => {
    const requestId = req.headers['x-request-id'];
    const services = proxyService_1.proxyService.getServices();
    const serviceStatus = {};
    for (const service of services) {
        try {
            const startTime = Date.now();
            await proxyService_1.proxyService.makeRequest(service.name.toLowerCase().replace(' ', ''), '/health', 'GET');
            const responseTime = Date.now() - startTime;
            serviceStatus[service.name] = {
                status: 'healthy',
                responseTime: `${responseTime}ms`,
                url: service.baseUrl,
            };
        }
        catch (error) {
            serviceStatus[service.name] = {
                status: 'unhealthy',
                error: error.message,
                url: service.baseUrl,
            };
        }
    }
    const healthData = {
        status: Object.values(serviceStatus).every((s) => s.status === 'healthy') ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: serviceStatus,
    };
    const statusCode = healthData.status === 'healthy' ? 200 : 503;
    logger_1.logger.info('Detailed health check performed', {
        requestId,
        status: healthData.status,
        serviceCount: services.length,
    });
    (0, response_1.sendSuccess)(res, 'Detailed health check completed', healthData, statusCode, requestId);
});
router.get('/ready', (req, res) => {
    const requestId = req.headers['x-request-id'];
    const isReady = true;
    if (isReady) {
        (0, response_1.sendSuccess)(res, 'Service is ready', { ready: true }, 200, requestId);
    }
    else {
        res.status(503).json({
            success: false,
            message: 'Service is not ready',
            data: { ready: false },
            timestamp: new Date().toISOString(),
            requestId,
        });
    }
});
router.get('/live', (req, res) => {
    const requestId = req.headers['x-request-id'];
    (0, response_1.sendSuccess)(res, 'Service is alive', { alive: true }, 200, requestId);
});
exports.default = router;
//# sourceMappingURL=health.js.map