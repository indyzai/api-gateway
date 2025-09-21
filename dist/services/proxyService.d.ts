import { Request, Response } from 'express';
import { AxiosResponse } from 'axios';
import { ServiceConfig } from '../types';
declare class ProxyService {
    private services;
    constructor();
    private initializeServices;
    createProxy(serviceName: string, pathRewrite?: Record<string, string>): import("http-proxy-middleware").RequestHandler;
    makeRequest(serviceName: string, path: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', data?: any, headers?: Record<string, string>): Promise<AxiosResponse>;
    handleProxiedRequest(req: Request, res: Response, serviceName: string, path: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'): Promise<void>;
    addService(name: string, config: ServiceConfig): void;
    removeService(name: string): boolean;
    getServices(): ServiceConfig[];
}
export declare const proxyService: ProxyService;
export {};
//# sourceMappingURL=proxyService.d.ts.map