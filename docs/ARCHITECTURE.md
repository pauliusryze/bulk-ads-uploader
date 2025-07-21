# Architecture Documentation

## System Overview

The Facebook Ads Bulk Uploader is a full-stack web application designed to streamline the process of creating multiple Facebook ads with different images. The system follows a client-server architecture with clear separation of concerns.

## High-Level Architecture

```
┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐
│   React Frontend │ ◄──────────────► │  Express Backend │
│   (TypeScript)   │                  │   (Node.js)     │
└─────────────────┘                  └─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │ Facebook API    │
                                    │ (Marketing API) │
                                    └─────────────────┘
```

## Component Architecture

### Frontend Architecture

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (Button, Input, etc.)
│   ├── forms/           # Form-specific components
│   └── layout/          # Layout components (Header, Sidebar, etc.)
├── pages/               # Page-level components
│   ├── Auth/            # Authentication pages
│   ├── Dashboard/       # Main dashboard
│   ├── Upload/          # Image upload interface
│   └── Templates/       # Template management
├── hooks/               # Custom React hooks
├── services/            # API communication layer
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

### Backend Architecture

```
src/
├── controllers/         # Request handlers
├── services/           # Business logic layer
│   ├── facebook/       # Facebook API integration
│   ├── upload/         # File upload handling
│   └── templates/      # Template management
├── middleware/         # Express middleware
├── routes/             # API route definitions
├── types/              # TypeScript definitions
└── utils/              # Utility functions
```

## Data Flow

### 1. Authentication Flow
```
User Input → Frontend Validation → Backend Validation → Facebook API → Response
```

### 2. Image Upload Flow
```
File Selection → Frontend Preview → Backend Storage → File URL Return
```

### 3. Ad Creation Flow
```
Template + Images → Preview Generation → Bulk Creation → Progress Tracking
```

## Key Technical Decisions

### 1. Technology Stack

**Frontend:**
- **React 18**: Latest version with concurrent features
- **TypeScript**: Type safety and better developer experience
- **Tailwind CSS**: Rapid UI development
- **React Query**: Server state management
- **React Hook Form**: Form handling with validation

**Backend:**
- **Node.js**: JavaScript runtime for server
- **Express.js**: Minimal web framework
- **Facebook Marketing API SDK**: Official SDK for API integration
- **Multer**: File upload handling
- **Joi**: Request validation
- **Winston**: Structured logging

### 2. State Management

**Frontend State:**
- **Local State**: Component-level state with useState
- **Server State**: API data with React Query
- **Form State**: Form data with React Hook Form

**Backend State:**
- **Stateless**: No persistent server state
- **File Storage**: Temporary file storage
- **Job Tracking**: In-memory job status (can be extended to Redis)

### 3. Error Handling Strategy

**Frontend:**
- Form validation with immediate feedback
- API error handling with user-friendly messages
- Global error boundary for unexpected errors

**Backend:**
- Input validation with Joi
- Facebook API error handling
- Structured error responses
- Comprehensive logging

### 4. Security Considerations

**Authentication:**
- Facebook OAuth integration
- Access token validation
- Secure token storage

**File Upload:**
- File type validation
- Size limits
- Secure file handling
- Temporary storage with cleanup

**API Security:**
- Input sanitization
- Rate limiting
- CORS configuration
- Error message sanitization

## API Design

### RESTful Endpoints

```
Authentication:
POST /api/auth/facebook     # Validate Facebook credentials

Images:
POST /api/images/upload     # Upload multiple images
GET  /api/images           # List uploaded images
DELETE /api/images/:id     # Delete specific image

Templates:
POST   /api/templates      # Create template
GET    /api/templates      # List templates
GET    /api/templates/:id  # Get specific template
PUT    /api/templates/:id  # Update template
DELETE /api/templates/:id  # Delete template

Ads:
POST /api/ads/bulk        # Create multiple ads
GET  /api/ads/status/:id  # Get upload progress
```

### Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Performance Considerations

### Frontend Performance
- Lazy loading of components
- Image optimization and compression
- Debounced API calls
- Efficient re-rendering with React.memo

### Backend Performance
- Async/await for non-blocking operations
- File streaming for large uploads
- Connection pooling for Facebook API
- Memory-efficient file handling

## Scalability Considerations

### Current MVP Limitations
- In-memory job tracking
- Local file storage
- Single server deployment

### Future Scalability Options
- Redis for job queue and caching
- Cloud storage (AWS S3, Google Cloud Storage)
- Load balancing with multiple instances
- Database for persistent storage
- Microservices architecture

## Monitoring and Logging

### Logging Strategy
- **Winston** for structured logging
- Different log levels (error, warn, info, debug)
- Request/response logging
- Error tracking with stack traces

### Monitoring Points
- API response times
- File upload success rates
- Facebook API error rates
- Memory usage
- Disk space usage

## Testing Strategy

### Frontend Testing
- Unit tests with Jest and React Testing Library
- Component testing
- Hook testing
- Integration tests for API calls

### Backend Testing
- Unit tests with Jest
- API endpoint testing
- Facebook API integration testing
- File upload testing

## Deployment Architecture

### Development Environment
- Local development with hot reload
- Environment-specific configuration
- Mock Facebook API for testing

### Production Environment
- Docker containerization
- Environment variable configuration
- Health check endpoints
- Graceful shutdown handling 