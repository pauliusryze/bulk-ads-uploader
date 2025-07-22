import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Missing Supabase configuration', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceKey
  });
  // Don't throw error, just log it - server can still start
  logger.warn('Supabase configuration missing - some features may not work');
}

// Create Supabase client
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test database connection (non-blocking)
const testConnection = async () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    logger.warn('Skipping database connection test - missing configuration');
    return;
  }
  
  try {
    await supabase.from('users').select('count').limit(1);
    logger.info('Connected to Supabase database');
  } catch (error) {
    logger.error('Failed to connect to Supabase', error);
    // Don't throw - server can still start without database
  }
};

// Run connection test in background
testConnection().catch(error => {
  logger.error('Database connection test failed', error);
});

export default supabase; 