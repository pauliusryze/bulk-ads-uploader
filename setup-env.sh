#!/bin/bash

echo "🔧 Setting up environment files with your Supabase credentials"
echo "============================================================"

# Backend environment file
echo "📝 Creating backend/env.local..."
cat > backend/env.local << 'EOF'
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://kqebqyztbuvvmbuvteoq.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZWJxeXp0YnV2dm1idXZ0ZW9xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1ODEwMSwiZXhwIjoyMDY4NjM0MTAxfQ.FIWsfGmAk11PPgwuI9HsMHWSf0gV33-gQ2sghwUmaLg
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZWJxeXp0YnV2dm1idXZ0ZW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNTgxMDEsImV4cCI6MjA2ODYzNDEwMX0.UaPpgzwd5HU7BvAzL6QFMcgG8hN9SrJxoXOlV_AyCko

# Facebook API Configuration
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
FACEBOOK_AD_ACCOUNT_ID=act_your_ad_account_id

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# CORS
CORS_ORIGIN=http://localhost:3000

# Security
SESSION_SECRET=your_session_secret_here
EOF

# Frontend environment file
echo "📝 Creating frontend/env.local..."
cat > frontend/env.local << 'EOF'
# React App Configuration
REACT_APP_NODE_ENV=development

# Supabase Configuration (Client-side)
REACT_APP_SUPABASE_URL=https://kqebqyztbuvvmbuvteoq.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZWJxeXp0YnV2dm1idXZ0ZW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNTgxMDEsImV4cCI6MjA2ODYzNDEwMX0.UaPpgzwd5HU7BvAzL6QFMcgG8hN9SrJxoXOlV_AyCko

# Facebook Configuration
REACT_APP_FACEBOOK_APP_ID=your_facebook_app_id

# API Configuration
REACT_APP_API_URL=http://localhost:3001

# Development Configuration
REACT_APP_MOCK_MODE=true
EOF

echo "✅ Environment files created successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Update Facebook App credentials in both env.local files"
echo "2. Run the SQL commands from SUPABASE_SETUP.md in your Supabase dashboard"
echo "3. Install dependencies: npm install"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm start"
echo ""
echo "🔑 Your Supabase credentials are now configured:"
echo "   URL: https://kqebqyztbuvvmbuvteoq.supabase.co"
echo "   Service Key: ✅ Configured"
echo "   Anon Key: ✅ Configured" 