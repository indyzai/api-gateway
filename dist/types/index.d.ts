import { Request } from 'express';
export interface User {
    id: string;
    email: string;
    role: string;
    permissions?: string[];
    iat?: number;
    exp?: number;
}
export interface AuthenticatedRequest extends Request {
    user?: User;
}
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    timestamp: string;
    requestId?: string;
}
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    message: string;
}
export interface ServiceConfig {
    name: string;
    baseUrl: string;
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
}
export interface ProxyConfig {
    target: string;
    changeOrigin: boolean;
    pathRewrite?: Record<string, string>;
    timeout?: number;
    headers?: Record<string, string>;
}
export interface JWTPayload {
    id: string;
    email: string;
    role: string;
    permissions?: string[];
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    role?: string;
}
export interface ValidationSchema {
    body?: any;
    query?: any;
    params?: any;
}
export interface LogContext {
    requestId?: string;
    userId?: string;
    method?: string;
    url?: string;
    userAgent?: string;
    error?: string;
    ip?: string;
    [prop: string]: any;
}
export interface ErrorResponse {
    success: false;
    message: string;
    error: string;
    timestamp: string;
    requestId?: string;
    stack?: string;
}
//# sourceMappingURL=index.d.ts.map