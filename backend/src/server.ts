import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import mediaRoutes from './routes/media';
import templateRoutes from './routes/templates';
import adRoutes from './routes/ads';

const app = express();
const PORT = parseInt(process.env.PORT || '5555', 10);
const isDevelopment = process.env.NODE_ENV === 'development';

logger.info('Starting server with configuration:', {
  PORT,
  NODE_ENV: process.env.NODE_ENV,
  isDevelopment
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env['CORS_ORIGIN'] || process.env['FRONTEND_URL'] || 'https://localhost:3002',
  credentials: true
}));

// Rate limiting - More generous for development and production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 2000 : 5000, // 2000 requests in prod, 5000 in dev
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(15 * 60 / 60), // 15 minutes in minutes
    timestamp: new Date().toISOString()
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      environment: process.env.NODE_ENV
    });
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 60),
      timestamp: new Date().toISOString()
    });
  }
});

// Apply rate limiting to API routes only
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploaded media
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT,
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/ads', adRoutes);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Route not found',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server based on environment
if (isDevelopment) {
  // HTTPS Configuration for development only
  try {
    const sslOptions = {
      key: fs.readFileSync(path.join(__dirname, '..', 'localhost-key.pem')),
      cert: fs.readFileSync(path.join(__dirname, '..', 'localhost.pem'))
    };

    // Start HTTPS server for development
    https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
      logger.info('HTTPS Server is running on port', PORT);
    });
  } catch (error) {
    logger.warn('SSL certificates not found, falling back to HTTP for development');
    // Fallback to HTTP for development
    http.createServer(app).listen(PORT, '0.0.0.0', () => {
      logger.info('HTTP Server is running on port', PORT);
    });
  }
} else {
  // HTTP server for production (Render handles HTTPS)
  const server = http.createServer(app);
  
  server.listen(PORT, '0.0.0.0', () => {
    logger.info('HTTP Server is running on port', PORT, 'in production mode');
  });
  
  server.on('error', (error) => {
    logger.error('Server error:', error);
    process.exit(1);
  });
}

export default app; 