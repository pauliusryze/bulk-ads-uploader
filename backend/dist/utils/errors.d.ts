export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    code?: string;
    constructor(message: string, statusCode?: number, code?: string);
}
export declare class ValidationError extends AppError {
    constructor(message: string, field?: string);
}
export declare class FacebookApiError extends AppError {
    constructor(message: string, facebookErrorCode?: number);
}
export declare class FileUploadError extends AppError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map