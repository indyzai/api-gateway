"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const validation_1 = require("../middleware/validation");
const authService_1 = require("../services/authService");
const proxyService_1 = require("../services/proxyService");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJWT);
router.use((0, auth_1.authorize)(['admin']));
router.use(rateLimiter_1.strictLimiter);
router.get('/users', (req, res) => {
    const requestId = req.headers['x-request-id'];
    const users = authService_1.authService.getAllUsers();
    logger_1.logger.info('Admin retrieved all users', {
        requestId,
        adminId: req.user?.id,
        userCount: users.length,
    });
    (0, response_1.sendSuccess)(res, 'Users retrieved', users, 200, requestId);
});
router.get('/users/:id', (0, validation_1.validate)(validation_1.schemas.idParam), (req, res) => {
    const requestId = req.headers['x-request-id'];
    const { id } = req.params;
    const user = authService_1.authService.getUserById(id);
    if (!user) {
        return (0, response_1.sendError)(res, 'User not found', 'USER_NOT_FOUND', 404, requestId);
    }
    (0, response_1.sendSuccess)(res, 'User retrieved', user, 200, requestId);
});
router.put('/users/:id/permissions', (0, validation_1.validate)({
    params: validation_1.schemas.idParam.params,
    body: joi_1.default.object({
        permissions: joi_1.default.array().items(joi_1.default.string()).required(),
    }),
}), (req, res) => {
    const requestId = req.headers['x-request-id'];
    const { id } = req.params;
    const { permissions } = req.body;
    const success = authService_1.authService.updateUserPermissions(id, permissions);
    if (!success) {
        return (0, response_1.sendError)(res, 'User not found', 'USER_NOT_FOUND', 404, requestId);
    }
    logger_1.logger.info('Admin updated user permissions', {
        requestId,
        adminId: req.user?.id,
        targetUserId: id,
        permissions,
    });
    (0, response_1.sendSuccess)(res, 'User permissions updated', null, 200, requestId);
});
router.delete('/users/:id', (0, validation_1.validate)(validation_1.schemas.idParam), (req, res) => {
    const requestId = req.headers['x-request-id'];
    const { id } = req.params;
    if (id === req.user?.id) {
        return (0, response_1.sendError)(res, 'Cannot delete your own account', 'SELF_DELETE_FORBIDDEN', 400, requestId);
    }
    const success = authService_1.authService.deleteUser(id);
    if (!success) {
        return (0, response_1.sendError)(res, 'User not found', 'USER_NOT_FOUND', 404, requestId);
    }
    logger_1.logger.info('Admin deleted user', {
        requestId,
        adminId: req.user?.id,
        deletedUserId: id,
    });
    (0, response_1.sendSuccess)(res, 'User deleted', null, 200, requestId);
});
router.get('/services', (req, res) => {
    const requestId = req.headers['x-request-id'];
    const services = proxyService_1.proxyService.getServices();
    (0, response_1.sendSuccess)(res, 'Services retrieved', services, 200, requestId);
});
router.post('/services', (0, validation_1.validate)({
    body: joi_1.default.object({
        name: joi_1.default.string().required(),
        baseUrl: joi_1.default.string().uri().required(),
        timeout: joi_1.default.number().integer().min(1000).max(60000).default(10000),
        retries: joi_1.default.number().integer().min(0).max(5).default(3),
        headers: joi_1.default.object().pattern(joi_1.default.string(), joi_1.default.string()).optional(),
    }),
}), (req, res) => {
    const requestId = req.headers['x-request-id'];
    const { name, ...serviceConfig } = req.body;
    const config = {
        name: serviceConfig.name || name,
        ...serviceConfig,
    };
    proxyService_1.proxyService.addService(name, config);
    logger_1.logger.info('Admin added new service', {
        requestId,
        adminId: req.user?.id,
        serviceName: name,
        serviceConfig: config,
    });
    (0, response_1.sendSuccess)(res, 'Service added', config, 201, requestId);
});
router.delete('/services/:name', (req, res) => {
    const requestId = req.headers['x-request-id'];
    const { name } = req.params;
    const success = proxyService_1.proxyService.removeService(name);
    if (!success) {
        return (0, response_1.sendError)(res, 'Service not found', 'SERVICE_NOT_FOUND', 404, requestId);
    }
    logger_1.logger.info('Admin removed service', {
        requestId,
        adminId: req.user?.id,
        serviceName: name,
    });
    (0, response_1.sendSuccess)(res, 'Service removed', null, 200, requestId);
});
router.get('/stats', (req, res) => {
    const requestId = req.headers['x-request-id'];
    const stats = {
        users: {
            total: authService_1.authService.getAllUsers().length,
            byRole: authService_1.authService.getAllUsers().reduce((acc, user) => {
                acc[user.role] = (acc[user.role] || 0) + 1;
                return acc;
            }, {}),
        },
        services: {
            total: proxyService_1.proxyService.getServices().length,
            list: proxyService_1.proxyService.getServices().map(s => ({ name: s.name, baseUrl: s.baseUrl })),
        },
        system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            environment: process.env.NODE_ENV,
        },
    };
    (0, response_1.sendSuccess)(res, 'System statistics retrieved', stats, 200, requestId);
});
exports.default = router;
//# sourceMappingURL=admin.js.map