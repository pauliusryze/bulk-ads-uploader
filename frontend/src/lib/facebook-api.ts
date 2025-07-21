// Facebook Marketing API Client
export interface FacebookAPIConfig {
  appId: string;
  accessToken: string;
  adAccountId: string;
  pageId?: string;
  sandboxMode: boolean;
}

export interface FacebookCampaignData {
  name: string;
  objective: 'LINK_CLICKS' | 'CONVERSIONS' | 'REACH' | 'BRAND_AWARENESS' | 'VIDEO_VIEWS';
  status: 'PAUSED' | 'ACTIVE';
  special_ad_categories?: string[];
}

export interface FacebookAdSetData {
  name: string;
  campaign_id: string;
  daily_budget: number;
  billing_event: 'IMPRESSIONS' | 'LINK_CLICKS';
  optimization_goal: 'LINK_CLICKS' | 'CONVERSIONS' | 'REACH' | 'BRAND_AWARENESS' | 'VIDEO_VIEWS';
  targeting: {
    age_min?: number;
    age_max?: number;
    genders?: number[];
    geo_locations?: {
      countries?: string[];
      regions?: string[];
      cities?: string[];
    };
    custom_audiences?: Array<{ id: string }>;
    interests?: Array<{ id: string }>;
  };
  status: 'PAUSED' | 'ACTIVE';
  bid_amount?: number;
}

export interface FacebookCreativeData {
  name: string;
  object_story_spec: {
    page_id: string;
    link_data?: {
      message: string;
      link: string;
      call_to_action?: {
        type: 'SHOP_NOW' | 'LEARN_MORE' | 'SIGN_UP' | 'BOOK_NOW' | 'CONTACT_US';
        value: {
          link: string;
        };
      };
    };
    video_data?: {
      video_id: string;
      message: string;
      call_to_action?: {
        type: 'SHOP_NOW' | 'LEARN_MORE' | 'SIGN_UP' | 'BOOK_NOW' | 'CONTACT_US';
        value: {
          link: string;
        };
      };
    };
  };
}

export interface FacebookAdData {
  name: string;
  adset_id: string;
  creative: {
    creative_id: string;
  };
  status: 'PAUSED' | 'ACTIVE';
}

export interface FacebookAPIError {
  error: {
    code: number;
    message: string;
    error_subcode?: number;
    error_user_title?: string;
    error_user_msg?: string;
  };
}

export interface FacebookAdAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  business_name?: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  category: string;
  access_token: string;
}

export interface FacebookCustomAudience {
  id: string;
  name: string;
  subtype: string;
  approximate_count?: number;
}

class FacebookAPIClient {
  private config: FacebookAPIConfig;
  private baseUrl = 'https://graph.facebook.com/v18.0';
  private isDevelopmentMode: boolean;

  constructor(config: FacebookAPIConfig) {
    this.config = config;
    this.isDevelopmentMode = process.env.NODE_ENV === 'development' && 
      (typeof window !== 'undefined' && window.location.protocol === 'http:');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // In development mode, return mock data
    if (this.isDevelopmentMode) {
      return this.getMockData<T>(endpoint);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const params = new URLSearchParams({
      access_token: this.config.accessToken,
    });

    const response = await fetch(`${url}?${params}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: FacebookAPIError = await response.json();
      throw new Error(error.error.message);
    }

    return response.json();
  }

  // Mock data for development mode
  private getMockData<T>(endpoint: string): T {
    console.log('Development mode: Using mock data for', endpoint);
    
    if (endpoint.includes('/me/adaccounts')) {
      return {
        data: [
          { id: 'act_123456789', name: 'Test Ad Account', currency: 'USD', timezone: 'America/New_York' },
          { id: 'act_987654321', name: 'Another Ad Account', currency: 'EUR', timezone: 'Europe/London' }
        ]
      } as T;
    }
    
    if (endpoint.includes('/me/accounts')) {
      return {
        data: [
          { id: '123456789', name: 'Test Page', category: 'Business', access_token: 'mock-page-token' },
          { id: '987654321', name: 'Another Page', category: 'Entertainment', access_token: 'mock-page-token-2' }
        ]
      } as T;
    }
    
    if (endpoint.includes('/customaudiences')) {
      return {
        data: [
          { id: '123456789', name: 'Test Audience', subtype: 'CUSTOM', approximate_count: 1000 },
          { id: '987654321', name: 'Another Audience', subtype: 'LOOKALIKE', approximate_count: 5000 }
        ]
      } as T;
    }
    
    if (endpoint.includes('/campaigns')) {
      return { id: 'campaign_123456789' } as T;
    }
    
    if (endpoint.includes('/adsets')) {
      return { id: 'adset_123456789' } as T;
    }
    
    if (endpoint.includes('/adcreatives')) {
      return { id: 'creative_123456789' } as T;
    }
    
    if (endpoint.includes('/ads')) {
      return { id: 'ad_123456789' } as T;
    }
    
    if (endpoint.includes('/adimages')) {
      return { id: 'image_123456789', hash: 'mock_image_hash' } as T;
    }
    
    if (endpoint.includes('/generatepreviews')) {
      return { body: '<div style="background: #f0f0f0; padding: 20px; border: 1px solid #ccc;"><h3>Mock Ad Preview</h3><p>This is a mock preview of your ad. In production, this would show the actual Facebook ad preview.</p></div>' } as T;
    }
    
    if (endpoint.includes('/previews')) {
      return { 
        data: [{ 
          body: '<div style="background: #f0f0f0; padding: 20px; border: 1px solid #ccc;"><h3>Mock Ad Preview</h3><p>This is a mock preview of your ad. In production, this would show the actual Facebook ad preview.</p></div>' 
        }] 
      } as T;
    }
    
    // Default mock response
    return { success: true, message: 'Mock response' } as T;
  }

  // Get user's ad accounts
  async getAdAccounts(): Promise<{ data: FacebookAdAccount[] }> {
    return this.request(`/me/adaccounts`);
  }

  // Get user's pages
  async getPages(): Promise<{ data: FacebookPage[] }> {
    return this.request(`/me/accounts`);
  }

  // Get custom audiences for ad account
  async getCustomAudiences(adAccountId: string): Promise<{ data: FacebookCustomAudience[] }> {
    return this.request(`/${adAccountId}/customaudiences`);
  }

  // Upload media to Facebook
  async uploadMedia(adAccountId: string, file: File): Promise<{ id: string; hash: string }> {
    const formData = new FormData();
    formData.append('source', file);
    formData.append('access_token', this.config.accessToken);

    const response = await fetch(`${this.baseUrl}/${adAccountId}/adimages`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error: FacebookAPIError = await response.json();
      throw new Error(error.error.message);
    }

    return response.json();
  }

  // Create campaign
  async createCampaign(adAccountId: string, data: FacebookCampaignData): Promise<{ id: string }> {
    return this.request(`/${adAccountId}/campaigns`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Create ad set
  async createAdSet(adAccountId: string, data: FacebookAdSetData): Promise<{ id: string }> {
    return this.request(`/${adAccountId}/adsets`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Create ad creative
  async createAdCreative(adAccountId: string, data: FacebookCreativeData): Promise<{ id: string }> {
    return this.request(`/${adAccountId}/adcreatives`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Create ad
  async createAd(adAccountId: string, data: FacebookAdData): Promise<{ id: string }> {
    return this.request(`/${adAccountId}/ads`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Generate ad preview
  async generateAdPreview(adAccountId: string, creativeSpec: any, adFormat: string): Promise<{ body: string }> {
    return this.request(`/${adAccountId}/generatepreviews`, {
      method: 'POST',
      body: JSON.stringify({
        creative: creativeSpec,
        ad_format: adFormat,
      }),
    });
  }

  // Get ad preview by ad ID
  async getAdPreview(adId: string): Promise<{ data: Array<{ body: string }> }> {
    return this.request(`/${adId}/previews`);
  }

  // Update ad status
  async updateAdStatus(adId: string, status: 'PAUSED' | 'ACTIVE'): Promise<void> {
    await this.request(`/${adId}`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  // Delete ad
  async deleteAd(adId: string): Promise<void> {
    await this.request(`/${adId}`, {
      method: 'DELETE',
    });
  }
}

export default FacebookAPIClient; 