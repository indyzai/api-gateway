"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const proxyService_1 = require("../services/proxyService");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.get('/services', auth_1.authenticateJWT, (req, res) => {
    const requestId = req.headers['x-request-id'];
    const services = proxyService_1.proxyService.getServices();
    (0, response_1.sendSuccess)(res, 'Services retrieved', services, 200, requestId);
});
router.use('/users', rateLimiter_1.apiLimiter, auth_1.optionalAuth, proxyService_1.proxyService.createProxy('users', {
    '^/proxy/users': '',
}));
router.get('/users/:id', rateLimiter_1.apiLimiter, auth_1.optionalAuth, async (req, res) => {
    const { id } = req.params;
    await proxyService_1.proxyService.handleProxiedRequest(req, res, 'users', `/users/${id}`, 'GET');
});
router.use('/payments', rateLimiter_1.apiLimiter, auth_1.authenticateJWT, proxyService_1.proxyService.createProxy('payments', {
    '^/proxy/payments': '/v1',
}));
router.post('/payments/charge', rateLimiter_1.apiLimiter, auth_1.authenticateJWT, async (req, res) => {
    const requestId = req.headers['x-request-id'];
    try {
        const paymentData = {
            ...req.body,
            customer_id: req.user?.id,
            metadata: {
                user_id: req.user?.id,
                user_email: req.user?.email,
                ...req.body.metadata,
            },
        };
        await proxyService_1.proxyService.handleProxiedRequest({ ...req, body: paymentData }, res, 'payments', '/v1/charges', 'POST');
    }
    catch (error) {
        logger_1.logger.error('Payment processing failed', error, {
            requestId,
            userId: req.user?.id,
            ip: req.ip,
        });
        (0, response_1.sendError)(res, 'Payment processing failed', 'PAYMENT_ERROR', 500, requestId);
    }
});
router.use('/notifications', rateLimiter_1.apiLimiter, auth_1.authenticateJWT, proxyService_1.proxyService.createProxy('notifications', {
    '^/proxy/notifications': '/v3',
}));
router.post('/notifications/send', rateLimiter_1.apiLimiter, auth_1.authenticateJWT, async (req, res) => {
    const requestId = req.headers['x-request-id'];
    try {
        const notificationData = {
            ...req.body,
            from: req.body.from || 'noreply@indyzai.com',
            personalizations: [{
                    to: [{ email: req.user?.email }],
                    subject: req.body.subject,
                    ...req.body.personalizations?.[0],
                }],
        };
        await proxyService_1.proxyService.handleProxiedRequest({ ...req, body: notificationData }, res, 'notifications', '/v3/mail/send', 'POST');
    }
    catch (error) {
        logger_1.logger.error('Notification sending failed', error, {
            requestId,
            userId: req.user?.id,
            ip: req.ip,
        });
        (0, response_1.sendError)(res, 'Notification sending failed', 'NOTIFICATION_ERROR', 500, requestId);
    }
});
router.all('/:service/*', rateLimiter_1.apiLimiter, auth_1.authenticateJWT, async (req, res) => {
    const { service } = req.params;
    const path = req.originalUrl.replace(`/api/proxy/${service}`, '');
    const requestId = req.headers['x-request-id'];
    try {
        await proxyService_1.proxyService.handleProxiedRequest(req, res, service, path, req.method);
    }
    catch (error) {
        logger_1.logger.error(`Proxy request to ${service} failed`, error, {
            requestId,
            service,
            path,
            method: req.method,
            userId: req.user?.id,
            ip: req.ip,
        });
        (0, response_1.sendError)(res, `Service '${service}' unavailable`, 'SERVICE_UNAVAILABLE', 502, requestId);
    }
});
exports.default = router;
//# sourceMappingURL=proxy.js.map