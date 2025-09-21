"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorResponse = exports.sendValidationError = exports.sendError = exports.sendSuccess = exports.createResponse = void 0;
const uuid_1 = require("uuid");
const createResponse = (success, message, data, error, requestId) => {
    return {
        success,
        message,
        data,
        error,
        timestamp: new Date().toISOString(),
        requestId: requestId || (0, uuid_1.v4)(),
    };
};
exports.createResponse = createResponse;
const sendSuccess = (res, message, data, statusCode = 200, requestId) => {
    return res.status(statusCode).json((0, exports.createResponse)(true, message, data, undefined, requestId));
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, error, statusCode = 400, requestId) => {
    return res.status(statusCode).json((0, exports.createResponse)(false, message, undefined, error, requestId));
};
exports.sendError = sendError;
const sendValidationError = (res, errors, requestId) => {
    return res.status(422).json((0, exports.createResponse)(false, 'Validation failed', undefined, errors, requestId));
};
exports.sendValidationError = sendValidationError;
const createErrorResponse = (message, error, requestId, stack) => {
    return {
        success: false,
        message,
        error,
        timestamp: new Date().toISOString(),
        requestId: requestId || (0, uuid_1.v4)(),
        ...(stack && { stack }),
    };
};
exports.createErrorResponse = createErrorResponse;
//# sourceMappingURL=response.js.map