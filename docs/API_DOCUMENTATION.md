# API Documentation

## Base URL
```
Development: http://localhost:3001
Production: https://your-domain.com
```

## Authentication

All API requests require proper authentication. The system uses Facebook API credentials for authentication.

### Headers
```
Content-Type: application/json
Authorization: Bearer <facebook_access_token> (for some endpoints)
```

## Response Format

All API responses follow this standard format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}
```

## Endpoints

### 1. Authentication

#### Validate Facebook Credentials
```http
POST /api/auth/facebook
```

**Request Body:**
```json
{
  "appId": "your_facebook_app_id",
  "appSecret": "your_facebook_app_secret",
  "accessToken": "your_facebook_access_token",
  "adAccountId": "act_your_ad_account_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "adAccount": {
      "id": "act_123456789",
      "name": "My Ad Account",
      "currency": "USD"
    },
    "permissions": ["ads_management", "ads_read"]
  },
  "message": "Facebook credentials validated successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Images

#### Upload Multiple Images
```http
POST /api/images/upload
```

**Request:**
- Content-Type: `multipart/form-data`
- Body: Multiple image files

**Form Data:**
```
images: [file1, file2, file3, ...]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadedImages": [
      {
        "id": "img_1",
        "filename": "image1.jpg",
        "url": "/uploads/image1.jpg",
        "size": 1024000,
        "mimeType": "image/jpeg",
        "dimensions": {
          "width": 1200,
          "height": 800
        }
      }
    ],
    "totalUploaded": 3,
    "failedUploads": []
  },
  "message": "Images uploaded successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### List Uploaded Images
```http
GET /api/images
```

**Response:**
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": "img_1",
        "filename": "image1.jpg",
        "url": "/uploads/image1.jpg",
        "size": 1024000,
        "uploadedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 5
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Delete Image
```http
DELETE /api/images/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. Templates

#### Create Ad Template
```http
POST /api/templates
```

**Request Body:**
```json
{
  "name": "Summer Sale Template",
  "description": "Template for summer sale ads",
  "adCopy": {
    "headline": "Summer Sale - Up to 50% Off!",
    "primaryText": "Don't miss out on our biggest sale of the year. Limited time offer!",
    "callToAction": "SHOP_NOW"
  },
  "targeting": {
    "ageMin": 18,
    "ageMax": 65,
    "genders": ["all"],
    "locations": ["US", "CA"],
    "interests": ["fashion", "shopping"]
  },
  "budget": {
    "amount": 100,
    "currency": "USD",
    "type": "DAILY"
  },
  "placement": {
    "facebook": true,
    "instagram": true,
    "audienceNetwork": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "template_1",
    "name": "Summer Sale Template",
    "description": "Template for summer sale ads",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Template created successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### List Templates
```http
GET /api/templates
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search by name or description

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template_1",
        "name": "Summer Sale Template",
        "description": "Template for summer sale ads",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Get Template
```http
GET /api/templates/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "template_1",
    "name": "Summer Sale Template",
    "description": "Template for summer sale ads",
    "adCopy": {
      "headline": "Summer Sale - Up to 50% Off!",
      "primaryText": "Don't miss out on our biggest sale of the year. Limited time offer!",
      "callToAction": "SHOP_NOW"
    },
    "targeting": {
      "ageMin": 18,
      "ageMax": 65,
      "genders": ["all"],
      "locations": ["US", "CA"],
      "interests": ["fashion", "shopping"]
    },
    "budget": {
      "amount": 100,
      "currency": "USD",
      "type": "DAILY"
    },
    "placement": {
      "facebook": true,
      "instagram": true,
      "audienceNetwork": false
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Update Template
```http
PUT /api/templates/:id
```

**Request Body:** Same as create template

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "template_1",
    "name": "Updated Summer Sale Template",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Template updated successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Delete Template
```http
DELETE /api/templates/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Template deleted successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 4. Ads

#### Create Bulk Ads
```http
POST /api/ads/bulk
```

**Request Body:**
```json
{
  "templateId": "template_1",
  "images": ["img_1", "img_2", "img_3"],
  "campaignName": "Summer Sale Campaign",
  "adSetName": "Summer Sale Ad Set",
  "options": {
    "createCampaign": true,
    "createAdSet": true,
    "status": "PAUSED"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_123456",
    "totalAds": 3,
    "status": "PROCESSING",
    "estimatedTime": "2-3 minutes"
  },
  "message": "Bulk ad creation started",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Get Upload Progress
```http
GET /api/ads/status/:jobId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_123456",
    "status": "PROCESSING",
    "progress": {
      "completed": 2,
      "total": 3,
      "percentage": 66.67
    },
    "results": [
      {
        "adId": "ad_1",
        "status": "SUCCESS",
        "facebookAdId": "123456789",
        "imageId": "img_1"
      },
      {
        "adId": "ad_2",
        "status": "SUCCESS",
        "facebookAdId": "123456790",
        "imageId": "img_2"
      }
    ],
    "errors": [],
    "startedAt": "2024-01-15T10:30:00Z",
    "estimatedCompletion": "2024-01-15T10:32:00Z"
  },
  "timestamp": "2024-01-15T10:31:00Z"
}
```

## Error Responses

### Validation Error
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "data": {
    "field": "accessToken",
    "message": "Access token is required"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Facebook API Error
```json
{
  "success": false,
  "error": "FACEBOOK_API_ERROR",
  "message": "Invalid access token",
  "data": {
    "facebookErrorCode": 190,
    "facebookErrorMessage": "Invalid OAuth 2.0 Access Token"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### File Upload Error
```json
{
  "success": false,
  "error": "FILE_UPLOAD_ERROR",
  "message": "File size exceeds limit",
  "data": {
    "maxSize": 10485760,
    "actualSize": 15728640
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Server Error
```json
{
  "success": false,
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **Image upload**: 10 requests per minute
- **Template operations**: 20 requests per minute
- **Ad creation**: 5 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1642234567
```

## File Upload Limits

- **Maximum file size**: 10MB per image
- **Supported formats**: JPG, PNG, GIF, WebP
- **Maximum files per request**: 20 images
- **Minimum dimensions**: 600x600 pixels
- **Maximum dimensions**: 4096x4096 pixels

## Facebook API Integration

### Required Permissions
- `ads_management`: Create and manage ads
- `ads_read`: Read ad account information
- `business_management`: Access business accounts

### Supported Ad Types
- **Image Ads**: Single image with text
- **Carousel Ads**: Multiple images in carousel
- **Video Ads**: Video content (future enhancement)

### Targeting Options
- **Demographics**: Age, gender, location
- **Interests**: Facebook interest targeting
- **Custom Audiences**: Uploaded customer lists
- **Lookalike Audiences**: Similar to existing customers 