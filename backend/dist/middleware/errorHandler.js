"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const errorHandler = (error, req, res, next) => {
    logger_1.logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    if (error instanceof errors_1.AppError) {
        res.status(error.statusCode).json({
            success: false,
            error: error.code || 'APP_ERROR',
            message: error.message,
            timestamp: new Date().toISOString()
        });
        return;
    }
    if (error.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: error.message,
            timestamp: new Date().toISOString()
        });
        return;
    }
    if (error.name === 'MulterError') {
        res.status(400).json({
            success: false,
            error: 'FILE_UPLOAD_ERROR',
            message: 'File upload failed',
            timestamp: new Date().toISOString()
        });
        return;
    }
    res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map