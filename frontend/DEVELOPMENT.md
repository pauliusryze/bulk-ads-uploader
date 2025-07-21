# Development Guide

## 🚀 **Quick Start**

### **Option 1: HTTPS Setup (Recommended for Facebook Login)**
1. **SSL Certificate Created** - `localhost.pem` and `localhost-key.pem` are ready
2. **HTTPS Enabled** - The start script now uses HTTPS
3. **Facebook Login Works** - Full OAuth flow available

```bash
npm start
# Access at https://localhost:3000
```

### **Option 2: Development Mode (Mock Facebook)**
- **No HTTPS Required** - Uses mock Facebook login
- **Test All Features** - Full functionality without real Facebook
- **Perfect for Development** - No Facebook app setup needed

## 🔧 **Database Requirements**

### **✅ No Database Required for Core Features**
- **✅ Template Management** - Uses local state
- **✅ Media Upload** - Uses local storage
- **✅ Ad Creation** - Direct to Facebook API
- **✅ Preview System** - Real-time previews

### **📊 Optional Database Features**
- **📊 Template Persistence** - Save templates to database
- **📊 Job History** - Track ad creation jobs
- **📊 User Management** - Multi-user support

## 🎯 **Current Setup**

### **✅ Working Features:**
1. **✅ Facebook Authentication** - OAuth or mock login
2. **✅ Template Creation** - Create ad templates
3. **✅ Media Upload** - Upload images/videos
4. **✅ Ad Preview** - See how ads will look
5. **✅ Bulk Creation** - Create multiple ads
6. **✅ Progress Tracking** - Real-time progress
7. **✅ Facebook Integration** - Direct API calls

### **🔧 Development Mode:**
- **✅ Mock Facebook Login** - No real Facebook app needed
- **✅ Mock Ad Accounts** - Test ad account selection
- **✅ Mock Pages** - Test page selection
- **✅ Full UI Testing** - All features work

## 🚀 **Testing the Application**

### **1. Start the Application:**
```bash
npm start
```

### **2. Access the App:**
- **HTTPS:** `https://localhost:3000` (Facebook Login works)
- **HTTP:** `http://localhost:3000` (Mock mode)

### **3. Test Features:**
1. **Connect to Facebook** - Click "Connect with Facebook"
2. **Select Ad Account** - Choose from dropdown
3. **Select Page** - Choose from dropdown
4. **Create Template** - Fill in ad copy and targeting
5. **Upload Media** - Upload images/videos
6. **Preview Ads** - See how ads will look
7. **Create Bulk Ads** - Create in PAUSED status

## 🎯 **Facebook App Setup (Production)**

### **For Real Facebook Integration:**
1. **Create Facebook App** at [Facebook Developers](https://developers.facebook.com/)
2. **Add Facebook Login** product
3. **Configure OAuth Redirect URIs:**
   - `https://localhost:3000/` (development)
   - `https://yourdomain.com/` (production)
4. **Set Environment Variables:**
   ```env
   REACT_APP_FACEBOOK_APP_ID=your-facebook-app-id
   ```

## 🛡️ **Safety Features**

### **✅ Development Safety:**
- **✅ Mock Mode** - No real Facebook calls
- **✅ PAUSED Status** - All ads created in draft mode
- **✅ Preview First** - See ads before creation
- **✅ Error Handling** - Comprehensive error messages

### **✅ Production Safety:**
- **✅ HTTPS Required** - Secure Facebook Login
- **✅ OAuth Flow** - Proper authentication
- **✅ Sandbox Mode** - Safe testing environment
- **✅ Draft Mode** - Ads created in PAUSED status

## 🎉 **Ready to Use!**

The application is **fully functional** for development and testing:

- **✅ No Database Required** - Core features work without database
- **✅ Mock Facebook** - Test all features without real Facebook app
- **✅ HTTPS Ready** - Facebook Login works with SSL certificate
- **✅ Full Feature Set** - Template creation, media upload, bulk ads

**Start developing and testing immediately!** 🚀 