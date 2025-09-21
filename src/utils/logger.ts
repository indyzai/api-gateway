import { Request, Response } from 'express';
import { LogContext } from '../types';
import config from '../config';

/**
 * Logger utility class
 */
class Logger {
  private isDevelopment = config.nodeEnv === 'development';

  /**
   * Log info message
   */
  info(message: string, context?: Partial<LogContext>): void {
    this.log('INFO', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Partial<LogContext>): void {
    this.log('WARN', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Partial<LogContext>): void {
    this.log('ERROR', message, context, error);
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: Partial<LogContext>): void {
    if (this.isDevelopment) {
      this.log('DEBUG', message, context);
    }
  }

  /**
   * Create log context from request
   */
  createContext(req: Request, requestId?: string): LogContext {
    return {
      requestId: requestId || req.headers['x-request-id'] as string || 'unknown',
      userId: (req as any).user?.id,
      method: req.method,
      url: req.originalUrl || req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress || 'unknown',
    };
  }

  /**
   * Log HTTP request
   */
  logRequest(req: Request, res: Response, responseTime?: number): void {
    const context = this.createContext(req);
    const message = `${req.method} ${req.originalUrl} - ${res.statusCode}`;
    
    if (responseTime) {
      this.info(`${message} - ${responseTime}ms`, context);
    } else {
      this.info(message, context);
    }
  }

  /**
   * Internal log method
   */
  private log(level: string, message: string, context?: Partial<LogContext>, error?: Error): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
      ...(error && { 
        error: error.message, 
        stack: this.isDevelopment ? error.stack : undefined 
      }),
    };

    if (this.isDevelopment) {
      console.log(JSON.stringify(logEntry, null, 2));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }
}

export const logger = new Logger();