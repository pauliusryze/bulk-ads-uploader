import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.code || 'APP_ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Handle file upload errors
  if (error.name === 'MulterError') {
    res.status(400).json({
      success: false,
      error: 'FILE_UPLOAD_ERROR',
      message: 'File upload failed',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
}; 