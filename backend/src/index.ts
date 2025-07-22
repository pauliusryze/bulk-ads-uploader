import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
// Try to load env.local first, then fall back to .env
dotenv.config({ path: path.resolve(process.cwd(), 'env.local') });
dotenv.config(); // Fallback to .env

console.log('Starting Facebook Ads Bulk Uploader Backend...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);

// Import logger first
import { logger } from './utils/logger';

logger.info('Starting Facebook Ads Bulk Uploader Backend...');

// Import and start the server with error handling
try {
  import('./server');
  logger.info('Server module imported successfully');
} catch (error) {
  logger.error('Failed to import server module:', error);
  console.error('Failed to import server module:', error);
  process.exit(1);
} 