import { Request, Response } from 'express';
import { LogContext } from '../types';
declare class Logger {
    private isDevelopment;
    info(message: string, context?: Partial<LogContext>): void;
    warn(message: string, context?: Partial<LogContext>): void;
    error(message: string, error?: Error, context?: Partial<LogContext>): void;
    debug(message: string, context?: Partial<LogContext>): void;
    createContext(req: Request, requestId?: string): Partial<LogContext>;
    logRequest(req: Request, res: Response, responseTime?: number): void;
    private log;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map