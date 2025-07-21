export function testEnvironmentVariables() {
  console.log('🔍 Testing environment variables...');
  
  const envVars = {
    'REACT_APP_SUPABASE_URL': process.env.REACT_APP_SUPABASE_URL,
    'REACT_APP_SUPABASE_ANON_KEY': process.env.REACT_APP_SUPABASE_ANON_KEY,
    'REACT_APP_FACEBOOK_APP_ID': process.env.REACT_APP_FACEBOOK_APP_ID,
    'REACT_APP_API_URL': process.env.REACT_APP_API_URL,
    'REACT_APP_MOCK_MODE': process.env.REACT_APP_MOCK_MODE,
  };

  console.log('Environment variables:', envVars);

  const missingVars = Object.entries(envVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars);
    return {
      success: false,
      missing: missingVars,
      message: `Missing environment variables: ${missingVars.join(', ')}`
    };
  }

  console.log('✅ All environment variables loaded successfully!');
  return {
    success: true,
    message: 'All environment variables loaded successfully'
  };
} 