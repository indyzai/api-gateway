"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyService = void 0;
const http_proxy_middleware_1 = require("http-proxy-middleware");
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
class ProxyService {
    constructor() {
        this.services = new Map();
        this.initializeServices();
    }
    initializeServices() {
        this.services.set('users', {
            name: 'User Service',
            baseUrl: config_1.default.services.userService,
            timeout: 10000,
            retries: 3,
        });
        this.services.set('payments', {
            name: 'Payment Service',
            baseUrl: config_1.default.services.paymentService,
            timeout: 15000,
            retries: 2,
            headers: {
                'Authorization': `Bearer ${config_1.default.apiKeys.stripe}`,
            },
        });
        this.services.set('notifications', {
            name: 'Notification Service',
            baseUrl: config_1.default.services.notificationService,
            timeout: 5000,
            retries: 1,
            headers: {
                'Authorization': `Bearer ${config_1.default.apiKeys.sendgrid}`,
            },
        });
    }
    createProxy(serviceName, pathRewrite) {
        const service = this.services.get(serviceName);
        if (!service) {
            throw new Error(`Service '${serviceName}' not found`);
        }
        const proxyOptions = {
            target: service.baseUrl,
            changeOrigin: true,
            timeout: service.timeout,
            pathRewrite: pathRewrite || {},
            onError: (err, req, res) => {
                const requestId = req.headers['x-request-id'];
                logger_1.logger.error(`Proxy error for ${serviceName}`, err, {
                    requestId,
                    method: req.method,
                    url: req.url,
                    ip: req.ip,
                });
                if (!res.headersSent) {
                    res.status(502).json({
                        success: false,
                        message: 'Bad Gateway - Service unavailable',
                        error: 'PROXY_ERROR',
                        timestamp: new Date().toISOString(),
                        requestId,
                    });
                }
            },
            onProxyReq: (proxyReq, req) => {
                const requestId = req.headers['x-request-id'];
                logger_1.logger.debug(`Proxying request to ${serviceName}`, {
                    requestId,
                    method: req.method,
                    url: req.url,
                    target: service.baseUrl,
                });
                if (service.headers) {
                    Object.entries(service.headers).forEach(([key, value]) => {
                        proxyReq.setHeader(key, value);
                    });
                }
                proxyReq.setHeader('X-Request-ID', requestId);
            },
            onProxyRes: (proxyRes, req) => {
                const requestId = req.headers['x-request-id'];
                logger_1.logger.debug(`Received response from ${serviceName}`, {
                    requestId,
                    statusCode: proxyRes.statusCode,
                    method: req.method,
                    url: req.url,
                });
            },
        };
        return (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions);
    }
    async makeRequest(serviceName, path, method = 'GET', data, headers) {
        const service = this.services.get(serviceName);
        if (!service) {
            throw new Error(`Service '${serviceName}' not found`);
        }
        const requestConfig = {
            method,
            url: `${service.baseUrl}${path}`,
            timeout: service.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...service.headers,
                ...headers,
            },
        };
        if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
            requestConfig.data = data;
        }
        let lastError;
        const maxRetries = service.retries || 1;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger_1.logger.debug(`Making request to ${serviceName} (attempt ${attempt}/${maxRetries})`, {
                    method,
                    url: requestConfig.url,
                    attempt,
                });
                const response = await (0, axios_1.default)(requestConfig);
                logger_1.logger.debug(`Request to ${serviceName} successful`, {
                    method,
                    url: requestConfig.url,
                    statusCode: response.status,
                    attempt,
                });
                return response;
            }
            catch (error) {
                lastError = error;
                logger_1.logger.warn(`Request to ${serviceName} failed (attempt ${attempt}/${maxRetries})`, {
                    method,
                    url: requestConfig.url,
                    error: error.message,
                    attempt,
                });
                if (attempt === maxRetries) {
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
        throw lastError;
    }
    async handleProxiedRequest(req, res, serviceName, path, method) {
        const requestId = req.headers['x-request-id'];
        try {
            const response = await this.makeRequest(serviceName, path, method || req.method, req.body, {
                'X-Request-ID': requestId,
                'X-Forwarded-For': req.ip || '',
                'User-Agent': req.headers['user-agent'] || '',
            });
            (0, response_1.sendSuccess)(res, 'Request successful', response.data, response.status, requestId);
        }
        catch (error) {
            logger_1.logger.error(`Proxied request failed`, error, {
                requestId,
                serviceName,
                path,
                method: method || req.method,
                ip: req.ip,
            });
            const statusCode = error.response?.status || 500;
            const errorMessage = error.response?.data?.message || error.message || 'Service unavailable';
            (0, response_1.sendError)(res, errorMessage, 'PROXY_REQUEST_FAILED', statusCode, requestId);
        }
    }
    addService(name, config) {
        this.services.set(name, config);
        logger_1.logger.info(`Service '${name}' added/updated`, { serviceConfig: config });
    }
    removeService(name) {
        const removed = this.services.delete(name);
        if (removed) {
            logger_1.logger.info(`Service '${name}' removed`);
        }
        return removed;
    }
    getServices() {
        return Array.from(this.services.values());
    }
}
exports.proxyService = new ProxyService();
//# sourceMappingURL=proxyService.js.map