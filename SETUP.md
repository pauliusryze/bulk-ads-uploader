# Facebook Ads Bulk Uploader - Setup Guide

## ✅ Step-by-Step Plan Progress

- [x] 1. Create project structure and documentation
- [x] 2. Set up backend (Node.js + Express)
- [x] 3. Set up frontend (React + TypeScript)
- [ ] 4. Implement Facebook API integration
- [ ] 5. Create image upload functionality
- [ ] 6. Build ad template system
- [ ] 7. Implement bulk ad creation
- [ ] 8. Add progress tracking and error handling
- [ ] 9. Create deployment configuration
- [ ] 10. Final testing and documentation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Facebook Developer Account
- Facebook App with Marketing API access

### 1. Clone and Install Dependencies

```bash
# Backend setup
cd backend
npm install

# Frontend setup
cd ../frontend
npm install
```

### 2. Environment Configuration

#### Backend Environment
```bash
cd backend
cp env.example .env
```

Edit `.env` with your Facebook API credentials:
```env
# Facebook API Configuration
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
FACEBOOK_AD_ACCOUNT_ID=act_your_ad_account_id

# Server Configuration
PORT=3001
NODE_ENV=development
```

#### Frontend Environment
```bash
cd frontend
cp .env.example .env
```

### 3. Facebook API Setup

1. **Create Facebook App**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Create a new app
   - Add "Marketing API" product

2. **Generate Access Token**
   - Go to Tools > Graph API Explorer
   - Select your app
   - Add permissions: `ads_management`, `ads_read`, `business_management`
   - Generate access token

3. **Get Ad Account ID**
   - Go to Facebook Ads Manager
   - Copy your Ad Account ID (format: `act_123456789`)

### 4. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## 📁 Project Structure

```
Meta Ads Uploader/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript definitions
│   ├── uploads/            # File storage
│   └── logs/               # Application logs
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── docs/                   # Documentation
└── README.md              # Main documentation
```

## 🔧 Development Commands

### Backend
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Lint code
```

### Frontend
```bash
cd frontend
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Lint code
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
```

### Frontend Tests
```bash
cd frontend
npm test             # Run all tests
npm test -- --watch  # Run tests in watch mode
```

## 📦 Production Build

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve the build folder with a static server
```

## 🔒 Security Checklist

- [ ] Environment variables properly configured
- [ ] Facebook API credentials secured
- [ ] File upload validation implemented
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Error handling without information leakage

## 🐛 Troubleshooting

### Common Issues

1. **Facebook API Errors**
   - Verify access token permissions
   - Check ad account ID format
   - Ensure app has Marketing API access

2. **File Upload Issues**
   - Check file size limits
   - Verify supported file types
   - Ensure upload directory exists

3. **CORS Errors**
   - Verify CORS configuration
   - Check frontend proxy settings
   - Ensure correct origin URLs

4. **TypeScript Errors**
   - Run `npm install` in both directories
   - Check TypeScript configuration
   - Verify type definitions

## 📚 Next Steps

After successful setup:

1. **Complete Backend Implementation**
   - Implement all controllers
   - Add Facebook API integration
   - Complete file upload functionality

2. **Complete Frontend Implementation**
   - Build all React components
   - Implement form handling
   - Add error handling and loading states

3. **Testing & Documentation**
   - Write comprehensive tests
   - Complete API documentation
   - Add user guides

4. **Deployment**
   - Set up production environment
   - Configure CI/CD pipeline
   - Monitor and maintain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details 