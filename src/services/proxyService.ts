import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { Request, Response } from 'express';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '../config';
import { ProxyConfig, ServiceConfig } from '../types';
import { logger } from '../utils/logger';
import { sendError, sendSuccess } from '../utils/response';

/**
 * Proxy Service Class
 */
class ProxyService {
  private services: Map<string, ServiceConfig> = new Map();

  constructor() {
    this.initializeServices();
  }

  /**
   * Initialize predefined services
   */
  private initializeServices(): void {
    this.services.set('users', {
      name: 'User Service',
      baseUrl: config.services.userService,
      timeout: 10000,
      retries: 3,
    });

    this.services.set('payments', {
      name: 'Payment Service',
      baseUrl: config.services.paymentService,
      timeout: 15000,
      retries: 2,
      headers: {
        'Authorization': `Bearer ${config.apiKeys.stripe}`,
      },
    });

    this.services.set('notifications', {
      name: 'Notification Service',
      baseUrl: config.services.notificationService,
      timeout: 5000,
      retries: 1,
      headers: {
        'Authorization': `Bearer ${config.apiKeys.sendgrid}`,
      },
    });
  }

  /**
   * Create proxy middleware for a service
   */
  createProxy(serviceName: string, pathRewrite?: Record<string, string>) {
    const service = this.services.get(serviceName);
    
    if (!service) {
      throw new Error(`Service '${serviceName}' not found`);
    }

    const proxyOptions: Options = {
      target: service.baseUrl,
      changeOrigin: true,
      timeout: service.timeout,
      pathRewrite: pathRewrite || {},
      onError: (err, req, res) => {
        const requestId = req.headers['x-request-id'] as string;
        logger.error(`Proxy error for ${serviceName}`, err, {
          requestId,
          method: req.method,
          url: req.url,
          ip: (req as any).ip,
        });

        if (!res.headersSent) {
          (res as Response).status(502).json({
            success: false,
            message: 'Bad Gateway - Service unavailable',
            error: 'PROXY_ERROR',
            timestamp: new Date().toISOString(),
            requestId,
          });
        }
      },
      onProxyReq: (proxyReq, req) => {
        const requestId = req.headers['x-request-id'] as string;
        logger.debug(`Proxying request to ${serviceName}`, {
          requestId,
          method: req.method,
          url: req.url,
          target: service.baseUrl,
        });

        // Add service-specific headers
        if (service.headers) {
          Object.entries(service.headers).forEach(([key, value]) => {
            proxyReq.setHeader(key, value);
          });
        }

        // Forward request ID
        proxyReq.setHeader('X-Request-ID', requestId);
      },
      onProxyRes: (proxyRes, req) => {
        const requestId = req.headers['x-request-id'] as string;
        logger.debug(`Received response from ${serviceName}`, {
          requestId,
          statusCode: proxyRes.statusCode,
          method: req.method,
          url: req.url,
        });
      },
    };

    return createProxyMiddleware(proxyOptions);
  }

  /**
   * Make direct HTTP request to a service
   */
  async makeRequest(
    serviceName: string,
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    data?: any,
    headers?: Record<string, string>
  ): Promise<AxiosResponse> {
    const service = this.services.get(serviceName);
    
    if (!service) {
      throw new Error(`Service '${serviceName}' not found`);
    }

    const requestConfig: AxiosRequestConfig = {
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

    let lastError: any;
    const maxRetries = service.retries || 1;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`Making request to ${serviceName} (attempt ${attempt}/${maxRetries})`, {
          method,
          url: requestConfig.url,
          attempt,
        });

        const response = await axios(requestConfig);
        
        logger.debug(`Request to ${serviceName} successful`, {
          method,
          url: requestConfig.url,
          statusCode: response.status,
          attempt,
        });

        return response;
      } catch (error: any) {
        lastError = error;
        
        logger.warn(`Request to ${serviceName} failed (attempt ${attempt}/${maxRetries})`, {
          method,
          url: requestConfig.url,
          error: error.message,
          attempt,
        });

        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError;
  }

  /**
   * Handle proxied request with error handling
   */
  async handleProxiedRequest(
    req: Request,
    res: Response,
    serviceName: string,
    path: string,
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  ): Promise<void> {
    const requestId = req.headers['x-request-id'] as string;
    
    try {
      const response = await this.makeRequest(
        serviceName,
        path,
        method || req.method as any,
        req.body,
        {
          'X-Request-ID': requestId,
          'X-Forwarded-For': req.ip || '',
          'User-Agent': req.headers['user-agent'] || '',
        }
      );

      sendSuccess(res, 'Request successful', response.data, response.status, requestId);
    } catch (error: any) {
      logger.error(`Proxied request failed`, error, {
        requestId,
        serviceName,
        path,
        method: method || req.method,
        ip: req.ip,
      });

      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || error.message || 'Service unavailable';
      
      sendError(res, errorMessage, 'PROXY_REQUEST_FAILED', statusCode, requestId);
    }
  }

  /**
   * Add or update a service configuration
   */
  addService(name: string, config: ServiceConfig): void {
    this.services.set(name, config);
    logger.info(`Service '${name}' added/updated`, { serviceConfig: config });
  }

  /**
   * Remove a service configuration
   */
  removeService(name: string): boolean {
    const removed = this.services.delete(name);
    if (removed) {
      logger.info(`Service '${name}' removed`);
    }
    return removed;
  }

  /**
   * Get all registered services
   */
  getServices(): ServiceConfig[] {
    return Array.from(this.services.values());
  }
}

export const proxyService = new ProxyService();