#!/bin/bash

echo "🚀 Setting up Supabase for Facebook Ads Uploader"
echo "================================================"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Supabase Configuration
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Facebook Configuration
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Development Configuration
NODE_ENV=development
PORT=3001
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Go to https://supabase.com and create a new project"
echo "2. Copy your project URL and API keys"
echo "3. Update the .env file with your Supabase credentials"
echo "4. Run the SQL commands from SUPABASE_SETUP.md in your Supabase dashboard"
echo "5. Install dependencies: npm install"
echo "6. Start development: npm run dev"
echo ""
echo "🎯 Benefits of Supabase:"
echo "✅ Real-time progress updates"
echo "✅ Secure user data with Row Level Security"
echo "✅ Built-in file storage for media uploads"
echo "✅ Auto-generated APIs"
echo "✅ Database functions for complex logic"
echo ""
echo "📚 See SUPABASE_SETUP.md for detailed instructions" 