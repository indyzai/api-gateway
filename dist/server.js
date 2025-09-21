"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = __importDefault(require("./config"));
const cors_1 = require("./middleware/cors");
const security_1 = require("./middleware/security");
const rateLimiter_1 = require("./middleware/rateLimiter");
const validation_1 = require("./middleware/validation");
const errorHandler_1 = require("./middleware/errorHandler");
const routes_1 = __importDefault(require("./routes"));
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
app.set('trust proxy', true);
app.use(security_1.requestId);
app.use(security_1.requestLogger);
app.use(security_1.securityHeaders);
app.use(cors_1.handlePreflight);
app.use(cors_1.corsMiddleware);
app.use((0, morgan_1.default)(config_1.default.logging.format));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(validation_1.sanitizeInput);
app.use(rateLimiter_1.generalLimiter);
app.use('/api', routes_1.default);
app.get('/ping', (req, res) => {
    res.json({
        success: true,
        message: 'pong',
        timestamp: new Date().toISOString()
    });
});
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
const PORT = config_1.default.port;
if (require.main === module) {
    app.listen(PORT, () => {
        logger_1.logger.info('IndyzAI API Gateway started', {
            port: PORT,
            environment: JSON.stringify(config_1.default.nodeEnv),
            version: '1.0.0',
        });
    });
}
exports.default = app;
//# sourceMappingURL=server.js.map