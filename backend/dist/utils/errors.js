"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadError = exports.FacebookApiError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        if (code) {
            this.code = code;
        }
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, field) {
        super(message, 400, 'VALIDATION_ERROR');
    }
}
exports.ValidationError = ValidationError;
class FacebookApiError extends AppError {
    constructor(message, facebookErrorCode) {
        super(message, 400, 'FACEBOOK_API_ERROR');
    }
}
exports.FacebookApiError = FacebookApiError;
class FileUploadError extends AppError {
    constructor(message) {
        super(message, 400, 'FILE_UPLOAD_ERROR');
    }
}
exports.FileUploadError = FileUploadError;
//# sourceMappingURL=errors.js.map