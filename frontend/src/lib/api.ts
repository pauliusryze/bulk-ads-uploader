import { FacebookCampaign, FacebookPage, EnhancedBulkAdRequest } from '../types';

// Debug environment variables
console.log('Environment variables:', {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_NODE_ENV: process.env.REACT_APP_NODE_ENV
});

// Temporary fix: Hardcode production URL if environment variable is not available
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://bulk-ads-uploader.onrender.com' : 'http://localhost:3001');

console.log('API_BASE_URL:', API_BASE_URL);
console.log('Build timestamp:', new Date().toISOString());

// API Response Types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

// Facebook Auth Types
export interface FacebookCredentials {
  appId: string;
  appSecret: string;
  accessToken: string;
  adAccountId: string;
}

export interface FacebookAdAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
}

export interface AuthStatus {
  isInitialized: boolean;
  hasAccessToken: boolean;
  hasAdAccountId: boolean;
}

// Media Types (Images and Videos)
export interface UploadedMedia {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  mediaType: 'image' | 'video';
  dimensions: {
    width: number;
    height: number;
  };
  duration?: number; // For videos
  uploadedAt: string;
}

export interface UploadResponse {
  uploadedMedia: UploadedMedia[];
  totalUploaded: number;
  failedUploads: string[];
}

// Template Types
export interface AdCopy {
  headline: string;
  primaryText: string;
  callToAction?: 'SHOP_NOW' | 'LEARN_MORE' | 'SIGN_UP' | 'BOOK_NOW' | 'CONTACT_US';
  description?: string;
}

export interface Targeting {
  ageMin?: number;
  ageMax?: number;
  genders?: ('all' | 'men' | 'women')[];
  locations?: string[];
  interests?: string[];
  customAudiences?: string[];
}

export interface Budget {
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD';
  type: 'DAILY' | 'LIFETIME';
}

export interface Placement {
  facebook: boolean;
  instagram: boolean;
  audienceNetwork: boolean;
}

export interface AdTemplate {
  id: string;
  name: string;
  adDescription?: string;
  adCopy: AdCopy;
  targeting: {
    ageMin?: number;
    ageMax?: number;
    locations?: {
      inclusion?: string[];
      exclusion?: string[];
    };
    interests?: string[];
    customAudienceExclusion?: string[];
    languages?: string[];
  };
  delivery?: {
    accelerated?: boolean;
    costPerResult?: number;
    costPerResultCurrency?: 'USD' | 'EUR' | 'GBP' | 'CAD';
  };
  conversion?: {
    conversionEvent?: any;
    dataset?: any;
  };
  placement: Placement;
  specialAdCategories?: string[];
  optimizationGoal?: 'LINK_CLICKS' | 'CONVERSIONS' | 'REACH' | 'BRAND_AWARENESS' | 'VIDEO_VIEWS';
  billingEvent?: 'IMPRESSIONS' | 'LINK_CLICKS';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  adDescription: string;
  adCopy: AdCopy;
  targeting: {
    ageMin: number;
    ageMax: number;
    locations: {
      inclusion: string[];
      exclusion: string[];
    };
    interests: string[];
  };
  delivery: {
    accelerated: boolean;
    costPerResult?: number;
    costPerResultCurrency?: 'USD' | 'EUR' | 'GBP' | 'CAD';
  };
  conversion: {
    conversionEvent: any | null;
    dataset: any | null;
  };
  placement: Placement;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  adCopy?: AdCopy;
  targeting?: Targeting;
  budget?: Budget;
  placement?: Placement;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TemplateListResponse {
  templates: AdTemplate[];
  pagination: PaginationInfo;
}

// Ad Types
export interface BulkAdRequest {
  templateId: string;
  media: string[]; // Media IDs (images or videos)
  campaignName: string;
  adSetName: string;
  options: {
    createCampaign: boolean;
    createAdSet: boolean;
    status: 'ACTIVE' | 'PAUSED';
    campaignBudget?: number;
    adSetBudget?: number;
  };
}

export interface AdCreationJob {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  totalAds: number;
  createdAds: number;
  failedAds: number;
  results: {
    campaignId?: string;
    adSetId?: string;
    adIds: string[];
    errors: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdCreationResponse {
  jobId: string;
  status: string;
  message: string;
}

// API Client Class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // Handle different response types
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Backend error response:', JSON.stringify(data, null, 2));
          throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return data;
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
        }
        throw new Error('Expected JSON response but received non-JSON data');
      }
    } catch (error) {
      // Enhanced error handling
      if (error instanceof TypeError && (error as Error).message.includes('fetch')) {
        console.error('Network error - server may be down:', error);
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request timeout:', error);
        throw new Error('Request timed out. Please try again.');
      }
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        console.error('CORS or connection error:', error);
        throw new Error('Connection failed. Please check your network and server status.');
      }
      
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number }> {
    const response = await this.request<{ status: string; timestamp: string; uptime: number }>('/health');
    return response.data!;
  }

  // Auth Endpoints
  async validateCredentials(credentials: FacebookCredentials): Promise<{
    isValid: boolean;
    adAccount?: FacebookAdAccount;
    permissions?: string[];
  }> {
    const response = await this.request<{
      isValid: boolean;
      adAccount?: FacebookAdAccount;
      permissions?: string[];
    }>('/api/auth/validate', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response.data!;
  }

  async getAuthStatus(): Promise<AuthStatus> {
    const response = await this.request<AuthStatus>('/api/auth/status');
    return response.data!;
  }

  // Media Upload and Management
  async uploadMedia(files: File[]): Promise<UploadResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('media', file);
    });

    const response = await this.request<UploadResponse>('/api/media/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
    return response.data!;
  }

  async getMedia(): Promise<{ media: UploadedMedia[]; total: number }> {
    const response = await this.request<{ media: UploadedMedia[]; total: number }>('/api/media');
    return response.data!;
  }

  async deleteMedia(mediaId: string): Promise<void> {
    await this.request(`/api/media/${mediaId}`, {
      method: 'DELETE',
    });
  }

  // Template Endpoints
  async createTemplate(template: CreateTemplateRequest): Promise<AdTemplate> {
    const response = await this.request<AdTemplate>('/api/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
    return response.data!;
  }

  async getTemplates(page = 1, limit = 10, search?: string): Promise<TemplateListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append('search', search);
    }

    const response = await this.request<TemplateListResponse>(`/api/templates?${params}`);
    return response.data!;
  }

  async getTemplate(templateId: string): Promise<AdTemplate> {
    const response = await this.request<AdTemplate>(`/api/templates/${templateId}`);
    return response.data!;
  }

  async updateTemplate(templateId: string, updates: UpdateTemplateRequest): Promise<AdTemplate> {
    const response = await this.request<AdTemplate>(`/api/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data!;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await this.request(`/api/templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  // Ad Endpoints
  async createBulkAds(request: BulkAdRequest): Promise<AdCreationResponse> {
    const response = await this.request<AdCreationResponse>('/api/ads/bulk', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data!;
  }

  async getJobStatus(jobId: string): Promise<AdCreationJob> {
    const response = await this.request<AdCreationJob>(`/api/ads/jobs/${jobId}`);
    return response.data!;
  }

  async getAllJobs(): Promise<{ jobs: AdCreationJob[]; total: number }> {
    const response = await this.request<{ jobs: AdCreationJob[]; total: number }>('/api/ads/jobs');
    return response.data!;
  }

  async deleteJob(jobId: string): Promise<void> {
    await this.request(`/api/ads/jobs/${jobId}`, {
      method: 'DELETE',
    });
  }

  // Facebook Campaigns and Pages
  async getFacebookCampaigns(): Promise<FacebookCampaign[]> {
    const response = await this.request<FacebookCampaign[]>('/api/facebook/campaigns');
    return response.data!;
  }

  async getFacebookPages(): Promise<FacebookPage[]> {
    const response = await this.request<FacebookPage[]>('/api/facebook/pages');
    return response.data!;
  }

  // Enhanced Bulk Ads
  async createEnhancedBulkAds(request: EnhancedBulkAdRequest): Promise<AdCreationResponse> {
    const response = await this.request<AdCreationResponse>('/api/ads/enhanced-bulk', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data!;
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

export type { EnhancedBulkAdRequest }; 