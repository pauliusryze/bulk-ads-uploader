# Supabase Setup Guide for Facebook Ads Uploader

## 🚀 **Why Supabase?**

Supabase is perfect for your Facebook Ads app because:
- ✅ **Real-time subscriptions** - Live progress updates
- ✅ **Built-in authentication** - Facebook Login integration
- ✅ **Row Level Security** - Secure user data
- ✅ **Auto-generated APIs** - Less backend code
- ✅ **File storage** - Media uploads
- ✅ **Database functions** - Serverless backend logic

## 📋 **Step 1: Create Supabase Project**

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Create new project:
   - **Name**: `facebook-ads-uploader`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to you
5. Wait for project to be ready (2-3 minutes)

## 📋 **Step 2: Get API Keys**

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Service Role Key** (for backend)
   - **Anon Key** (for frontend)

## 📋 **Step 3: Create Database Tables**

Run these SQL commands in **SQL Editor**:

### **Users Table**
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  facebook_user_id VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  ad_account_id VARCHAR(255) NOT NULL,
  permissions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = facebook_user_id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = facebook_user_id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = facebook_user_id);
```

### **Jobs Table**
```sql
CREATE TABLE jobs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  job_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own jobs
CREATE POLICY "Users can view own jobs" ON jobs
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE facebook_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own jobs" ON jobs
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE facebook_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own jobs" ON jobs
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM users WHERE facebook_user_id = auth.uid()::text
    )
  );
```

### **Ad History Table**
```sql
CREATE TABLE ad_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  job_id VARCHAR(255) REFERENCES jobs(job_id),
  campaign_id VARCHAR(255),
  ad_set_id VARCHAR(255),
  ad_id VARCHAR(255),
  ad_name VARCHAR(255),
  ad_copy JSONB,
  media_url TEXT,
  status VARCHAR(50),
  facebook_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ad_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own ad history
CREATE POLICY "Users can view own ad history" ON ad_history
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE facebook_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own ad history" ON ad_history
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE facebook_user_id = auth.uid()::text
    )
  );
```

### **Templates Table**
```sql
CREATE TABLE templates (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  ad_copy JSONB NOT NULL,
  targeting JSONB,
  budget JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own templates
CREATE POLICY "Users can view own templates" ON templates
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE facebook_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own templates" ON templates
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE facebook_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own templates" ON templates
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM users WHERE facebook_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own templates" ON templates
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM users WHERE facebook_user_id = auth.uid()::text
    )
  );
```

## 📋 **Step 4: Set Up File Storage**

1. Go to **Storage** → **Buckets**
2. Create bucket: `media-uploads`
3. Set to **Private** (requires authentication)
4. Add policy for authenticated users:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media-uploads' AND 
    auth.role() = 'authenticated'
  );

-- Allow users to view their own files
CREATE POLICY "Users can view own media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'media-uploads' AND 
    auth.role() = 'authenticated'
  );
```

## 📋 **Step 5: Environment Variables**

Add these to your `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Facebook Configuration
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Render.com Configuration
NODE_ENV=production
PORT=3001
```

## 📋 **Step 6: Real-time Subscriptions**

Supabase provides real-time updates. In your frontend:

```typescript
// Subscribe to job progress updates
const subscription = supabase
  .channel('job-progress')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'jobs',
    filter: `job_id=eq.${jobId}`
  }, (payload) => {
    console.log('Job progress updated:', payload.new);
    // Update UI with new progress
  })
  .subscribe();
```

## 🎯 **Benefits for Your App:**

### **✅ Real-time Progress Updates**
- Users see live progress as ads are created
- No polling needed - instant updates

### **✅ Secure User Data**
- Row Level Security ensures users only see their data
- Facebook Login integration

### **✅ File Storage**
- Media uploads stored securely
- CDN for fast image delivery

### **✅ Database Functions**
- Serverless backend logic
- Complex queries without API endpoints

### **✅ Auto-generated APIs**
- REST and GraphQL APIs automatically generated
- Less backend code to maintain

## 🚀 **Deployment**

1. **Render.com**: Add environment variables
2. **Frontend**: Use Supabase client for real-time updates
3. **Backend**: Use service role key for admin operations

## 📊 **Monitoring**

- **Supabase Dashboard**: Monitor database usage
- **Logs**: View real-time logs
- **Analytics**: Track user activity

Your Facebook Ads app will be much more powerful with Supabase! 