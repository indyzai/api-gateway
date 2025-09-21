"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const config_1 = __importDefault(require("../config"));
class Logger {
    constructor() {
        this.isDevelopment = config_1.default.nodeEnv === 'development';
    }
    info(message, context) {
        this.log('INFO', message, context);
    }
    warn(message, context) {
        this.log('WARN', message, context);
    }
    error(message, error, context) {
        this.log('ERROR', message, context, error);
    }
    debug(message, context) {
        if (this.isDevelopment) {
            this.log('DEBUG', message, context);
        }
    }
    createContext(req, requestId) {
        return {
            requestId: requestId || req.headers['x-request-id'] || 'unknown',
            userId: req.user?.id,
            method: req.method,
            url: req.originalUrl || req.url,
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.connection.remoteAddress || 'unknown',
        };
    }
    logRequest(req, res, responseTime) {
        const context = this.createContext(req);
        const message = `${req.method} ${req.originalUrl} - ${res.statusCode}`;
        if (responseTime) {
            this.info(`${message} - ${responseTime}ms`, context);
        }
        else {
            this.info(message, context);
        }
    }
    log(level, message, context, error) {
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
        }
        else {
            console.log(JSON.stringify(logEntry));
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map