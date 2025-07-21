import dotenv from 'dotenv';
import { logger } from './utils/logger';
import path from 'path';

// Load environment variables
// Try to load env.local first, then fall back to .env
dotenv.config({ path: path.resolve(process.cwd(), 'env.local') });
dotenv.config(); // Fallback to .env

// Import and start the server
import './server';

logger.info('Starting Facebook Ads Bulk Uploader Backend...'); 