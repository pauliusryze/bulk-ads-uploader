import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', process.env.REACT_APP_SUPABASE_URL);
    console.log('Anon Key:', process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }

    console.log('✅ Supabase connection successful!');
    console.log('Response:', data);
    
    return {
      success: true,
      data: data,
      message: 'Supabase connection verified successfully'
    };

  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    };
  }
}

// Test real-time subscription
export function testRealTimeSubscription() {
  console.log('🔍 Testing real-time subscription...');
  
  const subscription = supabase
    .channel('test-channel')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'jobs'
    }, (payload) => {
      console.log('✅ Real-time update received:', payload);
    })
    .subscribe();

  // Cleanup after 5 seconds
  setTimeout(() => {
    subscription.unsubscribe();
    console.log('✅ Real-time subscription test completed');
  }, 5000);

  return subscription;
} 