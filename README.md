# Facebook Ads Bulk Uploader

A web application for bulk uploading Facebook ads with multiple images and configurable templates.

## 🚀 Features

- **Bulk Image Upload**: Upload multiple images at once
- **Ad Template System**: Create reusable ad templates
- **Facebook API Integration**: Direct integration with Facebook Marketing API
- **Progress Tracking**: Real-time upload progress and status
- **Error Handling**: Comprehensive error handling and validation
- **Modern UI**: Clean, responsive interface built with React

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for styling
- **React Hook Form** for form management
- **Axios** for API communication
- **React Query** for state management

### Backend (Node.js + Express)
- **Express.js** for REST API
- **Facebook Marketing API SDK** for ad creation
- **Multer** for file upload handling
- **Joi** for request validation
- **Winston** for logging

### File Structure
```
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript definitions
│   └── uploads/            # Temporary file storage
└── docs/                   # Documentation
```

## 📋 Prerequisites

### Facebook API Setup
1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Add the Marketing API product to your app
3. Generate an access token with `ads_management` permission
4. Get your Ad Account ID from Facebook Ads Manager

### Required Environment Variables
```env
# Facebook API
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_ACCESS_TOKEN=your_access_token
FACEBOOK_AD_ACCOUNT_ID=your_ad_account_id

# Server
PORT=3001
NODE_ENV=development

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_PATH=./uploads
```

## 🛠️ Installation

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🚀 Usage

1. **Configure Facebook API**: Enter your Facebook API credentials
2. **Upload Images**: Drag and drop multiple images
3. **Create Template**: Configure ad copy, targeting, and budget
4. **Preview Ads**: Review all generated ads
5. **Bulk Upload**: Create all ads with progress tracking

## 📚 API Documentation

### Authentication
- `POST /api/auth/facebook` - Validate Facebook credentials

### Images
- `POST /api/images/upload` - Upload multiple images
- `GET /api/images` - List uploaded images

### Templates
- `POST /api/templates` - Create ad template
- `GET /api/templates` - List templates
- `PUT /api/templates/:id` - Update template

### Ads
- `POST /api/ads/bulk` - Create multiple ads
- `GET /api/ads/status/:jobId` - Get upload progress

## 🔒 Security

- Input validation on all endpoints
- File type and size restrictions
- Rate limiting on API endpoints
- Secure file handling
- Error logging without exposing sensitive data

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## 📦 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details 