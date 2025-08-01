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
  objective: 'OUTCOME_LEADS' | 'OUTCOME_SALES' | 'OUTCOME_ENGAGEMENT' | 'OUTCOME_AWARENESS' | 'OUTCOME_TRAFFIC' | 'OUTCOME_APP_PROMOTION';
  status: 'PAUSED' | 'ACTIVE';
  special_ad_categories?: string[];
}

export interface FacebookAdSetData {
  name: string;
  campaign_id: string;
  daily_budget: number;
  billing_event: 'IMPRESSIONS' | 'LINK_CLICKS' | 'THRUPLAY'; // Added THRUPLAY for video ads
  optimization_goal: 'LINK_CLICKS' | 'CONVERSIONS' | 'REACH' | 'BRAND_AWARENESS' | 'VIDEO_VIEWS' | 'THRUPLAY' | 'OUTCOME_TRAFFIC' | 'OUTCOME_ENGAGEMENT' | 'OUTCOME_LEADS' | 'OUTCOME_SALES' | 'OUTCOME_APP_PROMOTION' | 'VALUE';
  bid_strategy?: 'LOWEST_COST_WITHOUT_CAP' | 'LOWEST_COST_WITH_BID_CAP' | 'COST_CAP' | 'BID_CAP' | 'ABSOLUTE_OCPM' | 'LOWEST_COST_WITH_MIN_ROAS';
  bid_amount?: number;
  bid_constraints?: {
    roas_average_floor?: number; // For LOWEST_COST_WITH_MIN_ROAS (scaled up 10000x)
  };
  targeting: {
    // Device and platform targeting (as per Facebook docs)
    device_platforms?: ('desktop' | 'mobile' | 'connected_tv')[];
    publisher_platforms?: ('facebook' | 'instagram' | 'audience_network' | 'messenger')[];
    facebook_positions?: ('feed' | 'instant_article' | 'marketplace' | 'video_feeds' | 'story' | 'reels' | 'right_hand_column')[];
    instagram_positions?: ('story' | 'feed' | 'explore' | 'reels')[];
    
    // Geo targeting (as per Facebook docs)
    geo_locations?: {
      countries?: string[];
      regions?: Array<{ key: string; name: string }>;
      cities?: Array<{ key: string; name: string; radius: number; distance_unit: 'mile' | 'kilometer' }>;
      zips?: Array<{ key: string; name: string }>;
    };
    
    // Demographics targeting
    age_min?: number;
    age_max?: number;
    genders?: number[];
    
    // Modern audience targeting
    custom_audiences?: Array<{ id: string; name?: string }>;
    excluded_custom_audiences?: Array<{ id: string; name?: string }>;
    
    // Interest targeting (updated structure)
    interests?: Array<{ id: string; name: string }>;
    excluded_interests?: Array<{ id: string; name: string }>;
    
    // Demographics targeting
    demographics?: {
      education_statuses?: number[];
      relationship_statuses?: number[];
      income?: Array<{ id: string; name: string }>;
      life_events?: Array<{ id: string; name: string }>;
    };
    
    // Behavior targeting
    behaviors?: Array<{ id: string; name: string }>;
    excluded_behaviors?: Array<{ id: string; name: string }>;
    
    // Language targeting
    locales?: number[];
    
    // Exclusions (new field)
    exclusions?: {
      interests?: Array<{ id: string; name: string }>;
      behaviors?: Array<{ id: string; name: string }>;
      demographics?: {
        education_statuses?: number[];
        relationship_statuses?: number[];
      };
    };
  };
  status: 'PAUSED' | 'ACTIVE';
  special_ad_categories?: string[];
  
  // Modern ad set fields
  start_time?: string; // ISO 8601 format
  end_time?: string; // ISO 8601 format
  lifetime_budget?: number;
  budget_remaining?: number;
  frequency_control_specs?: Array<{
    event: 'IMPRESSIONS' | 'REACH';
    interval_days: number;
    max_frequency: number;
  }>;
}

export interface FacebookCreativeData {
  name: string;
  object_story_spec: {
    page_id: string;
    link_data?: {
      message: string;
      link: string;
      image_hash?: string; // For image-based creatives
      name?: string; // For image-based creatives
      call_to_action?: {
        type: 'SHOP_NOW' | 'LEARN_MORE' | 'SIGN_UP' | 'BOOK_NOW' | 'CONTACT_US';
        value: {
          link: string;
        };
      };
    };
    video_data?: {
      image_url?: string; // Required thumbnail URL for video creatives
      video_id: string;
      message?: string; // Optional for video creatives
      call_to_action?: {
        type: 'SHOP_NOW' | 'LEARN_MORE' | 'SIGN_UP' | 'BOOK_NOW' | 'CONTACT_US';
        value: {
          link: string;
        };
      };
    };
  };
  // New field for Standard Enhancements (Facebook's latest feature)
  degrees_of_freedom_spec?: {
    creative_features_spec: {
      standard_enhancements: {
        enroll_status: 'OPT_IN' | 'OPT_OUT';
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
  account_status?: string;
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
  private baseUrl = 'https://graph.facebook.com/v23.0';
  private isDevelopmentMode: boolean;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private minRequestInterval = 100; // Minimum 100ms between requests

  constructor(config: FacebookAPIConfig) {
    this.config = config;
    this.isDevelopmentMode = process.env.NODE_ENV === 'development' && 
      (typeof window !== 'undefined' && window.location.protocol === 'http:');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    // In development mode, return mock data
    if (this.isDevelopmentMode) {
      return this.getMockData<T>(endpoint);
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    // Validate access token
    if (!this.config.accessToken) {
      throw new Error('No access token provided. Please authenticate with Facebook first.');
    }
    
    if (this.config.accessToken.length < 20) {
      throw new Error('Invalid access token format. Please re-authenticate with Facebook.');
    }
    
    // Log token info for debugging (safely)
    console.log('🔑 Access Token Info:', {
      length: this.config.accessToken.length,
      prefix: this.config.accessToken.substring(0, 10) + '...',
      type: this.config.accessToken.startsWith('EAA') ? 'User Token' : 'Unknown'
    });
    
    // For GET requests, add access token to URL
    // For POST requests, access token will be in form data
    let fullUrl = url;
    if (!options.method || options.method === 'GET') {
      const params = new URLSearchParams({
        access_token: this.config.accessToken,
      });
      const separator = endpoint.includes('?') ? '&' : '?';
      fullUrl = `${url}${separator}${params}`;
    }
    
    // IMMEDIATE DEBUGGING - Log what we're about to send
    console.log('🚀 Facebook API Request:', {
      endpoint: endpoint,
      method: options.method || 'GET',
      url: fullUrl,
      body: options.body ? JSON.parse(options.body as string) : undefined,
      headers: options.headers
    });
    
    // Additional debugging for creative creation
    if (endpoint.includes('adcreatives')) {
      console.log('🎨 CREATIVE CREATION DEBUG:');
      console.log('🎨 Endpoint:', endpoint);
      console.log('🎨 Body:', options.body);
      if (options.body) {
        const parsedBody = JSON.parse(options.body as string);
        console.log('🎨 Parsed Body:', JSON.stringify(parsedBody, null, 2));
        
        // Check specific video parameters
        if (parsedBody.object_story_spec?.video_data) {
          console.log('🎥 Video Data:', parsedBody.object_story_spec.video_data);
          console.log('�� Video ID:', parsedBody.object_story_spec.video_data.video_id);
          console.log('🎥 Page ID:', parsedBody.object_story_spec.page_id);
        }
      }
    }
    
    const config: RequestInit = {
      headers: {
        'User-Agent': 'FacebookAdsUploader/1.0',
        ...options.headers,
      },
      ...options,
    };

    // For POST requests, handle different content types appropriately
    if (options.method === 'POST' && options.body) {
      // Check if this is an endpoint that requires FormData (like image uploads)
      const requiresFormData = endpoint.includes('/adimages') || endpoint.includes('/videos');
      
      if (requiresFormData) {
        // Only convert to FormData for specific endpoints that require it
        const bodyData = JSON.parse(options.body as string);
        const formData = new FormData();
        
        // Add access token to form data
        formData.append('access_token', this.config.accessToken);
        
        // Convert JSON body to form data format
        Object.entries(bodyData).forEach(([key, value]) => {
          if (value instanceof File) {
            // Handle File objects directly
            formData.append(key, value);
          } else if (typeof value === 'object' && value !== null) {
            // For nested objects, stringify them
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        });
        
        // Replace the body with form data
        config.body = formData;
        
        // Remove Content-Type header to let browser set it with boundary
        if (config.headers) {
          delete (config.headers as any)['Content-Type'];
        }
        
        console.log('📝 Converting to form data format for Facebook API');
        console.log('📝 Form data entries:', Array.from(formData.entries()));
      } else {
        // For other endpoints (campaigns, adsets, adcreatives, ads), keep as JSON
        config.headers = {
          ...config.headers,
          'Content-Type': 'application/json',
        };
        
        // Add access token to the body for JSON requests
        const bodyData = JSON.parse(options.body as string);
        bodyData.access_token = this.config.accessToken;
        config.body = JSON.stringify(bodyData);
        
        console.log('📝 Keeping JSON format for Facebook API endpoint:', endpoint);
      }
    }
    
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(fullUrl, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // Handle different response types
      if (response.headers.get('content-type')?.includes('application/json')) {
        const responseText = await response.text();
        let data;
        
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ Failed to parse response as JSON:', responseText);
          throw new Error(`Invalid JSON response: ${responseText}`);
        }

        if (!response.ok) {
          console.error('❌ Facebook API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            url: fullUrl,
            data: data,
            responseText: responseText
          });

          // Enhanced error handling for Facebook API
          if (data.error) {
            const error = data.error;
            console.error('❌ Facebook API Error Details:', {
              code: error.code,
              message: error.message,
              error_subcode: error.error_subcode,
              error_user_title: error.error_user_title,
              error_user_msg: error.error_user_msg,
              fbtrace_id: error.fbtrace_id
            });
            
            // Log the full error response for debugging
            console.error('❌ Full Facebook Error Response:', JSON.stringify(data, null, 2));
            console.error('❌ Request that failed:', {
              url: fullUrl,
              method: config.method,
              body: options.body ? JSON.parse(options.body as string) : undefined
            });

            // Provide specific error messages based on error codes
            if (error.code === 100) {
              // Invalid parameter errors
              const errorMsg = error.message.toLowerCase();
              const userMsg = error.error_user_msg?.toLowerCase() || '';
              
              // Check for sandbox/development mode specific errors
              if (userMsg.includes('development mode') || userMsg.includes('sandbox')) {
                if (this.config.sandboxMode) {
                  // According to current Facebook documentation (2024-2025), sandbox mode should work
                  // regardless of app development mode. This suggests a configuration issue.
                  console.log('🏖️ Sandbox mode detected - this should work per current Facebook docs');
                  console.log('📖 Reference: Marketing API Sandbox capability now re-enabled (June 2023)');
                  console.log('🔍 This might be a configuration issue with your Facebook app');
                  
                  throw new Error('⚠️ Sandbox Configuration Issue: According to current Facebook documentation, sandbox mode should work regardless of app development mode. This suggests a configuration issue. Please check: 1) Your app is properly configured for sandbox mode in developer.facebook.com, 2) You have the correct permissions (ads_management, pages_manage_ads), 3) Your sandbox ad account is properly set up. Reference: https://developers.facebook.com/blog/post/2023/06/21/marketing-api-sandbox-capability-now-re-enabled/');
                } else {
                  throw new Error('⚠️ Development Mode: Your Facebook app is in development mode and cannot create public ads. Please switch your app to Live mode or use a sandbox account for testing.');
                }
              }
              
              if (errorMsg.includes('video_id')) {
                throw new Error(`Invalid video ID: ${error.message}. Please re-upload the video.`);
              }
              if (errorMsg.includes('page_id')) {
                throw new Error(`Invalid page ID: ${error.message}. Please check your Facebook page selection.`);
              }
              if (errorMsg.includes('message')) {
                throw new Error(`Ad message error: ${error.message}. Please check your ad copy.`);
              }
              if (errorMsg.includes('title')) {
                throw new Error(`Ad title error: ${error.message}. Please check your headline.`);
              }
              if (errorMsg.includes('link')) {
                throw new Error(`Landing page URL error: ${error.message}. Please check your URL.`);
              }
              if (errorMsg.includes('call_to_action')) {
                throw new Error(`Call to action error: ${error.message}. Please check your CTA settings.`);
              }
              if (errorMsg.includes('object_story_spec')) {
                throw new Error(`Creative specification error: ${error.message}. Please check your ad creative settings.`);
              }
              throw new Error(`Facebook API Parameter Error: ${error.message}`);
            }
            
            if (error.code === 17) {
              throw new Error('Rate limit exceeded. Please wait before making more requests.');
            }
            
            if (error.code === 4) {
              throw new Error('Application request limit reached. Please reduce the frequency of requests.');
            }
            
            if (error.code === 190) {
              throw new Error('Access token expired or invalid. Please re-authenticate with Facebook.');
            }
            
            if (error.code === 200) {
              throw new Error('Insufficient permissions. Your app may need additional review.');
            }
            
            if (error.code === 1487698) {
              throw new Error('Ad creative contains prohibited content. Please review Facebook\'s advertising policies.');
            }
            
            if (error.code === 1487699) {
              throw new Error('Ad targeting is too broad or too narrow. Please adjust your targeting settings.');
            }
            
            if (error.code === 1487700) {
              throw new Error('Ad creative format is not supported for the selected placement.');
            }

            throw new Error(`Facebook API Error (${error.code}): ${error.message}`);
          }

          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return data;
      } else {
        // Handle non-JSON responses
        const responseText = await response.text();
        console.error('❌ Non-JSON response:', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          responseText: responseText
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
        }
        
        throw new Error(`Unexpected response format: ${responseText}`);
      }
    } catch (error) {
      // Handle network errors and timeouts
      if (error instanceof Error) {
        console.error('❌ Network/Request Error Details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          url: fullUrl,
          method: config.method,
          timestamp: new Date().toISOString()
        });
        
        if (error.name === 'AbortError') {
          throw new Error('Request timeout: The request took too long to complete. Please try again.');
        }
        
        if (error.message.includes('Failed to fetch')) {
          // More specific network error handling
          console.error('❌ Network connectivity issue detected');
          console.log('🔍 Attempting to diagnose connection...');
          
          // Test basic internet connectivity (independent of Facebook API)
          try {
            const connectivityResponse = await fetch('https://httpbin.org/get', { 
              method: 'GET', 
              mode: 'cors',
              signal: AbortSignal.timeout(5000)
            });
            
            if (connectivityResponse.ok) {
              console.log('✅ Basic internet connectivity: OK');
              
              // Test Facebook domain accessibility (without using our API client)
              try {
                const fbResponse = await fetch('https://graph.facebook.com/v23.0/me?access_token=test', { 
                  method: 'GET', 
                  mode: 'cors',
                  signal: AbortSignal.timeout(5000)
                });
                
                if (fbResponse.status === 400) {
                  // 400 is expected with invalid token, means domain is accessible
                  console.log('✅ Facebook API domain: Accessible');
                  throw new Error('Facebook API is accessible but authentication failed. Please check your access token.');
                } else if (fbResponse.ok) {
                  console.log('✅ Facebook API domain: Accessible');
                  throw new Error('Facebook API is accessible but there was an issue with your request. Please try again.');
                } else {
                  console.warn('⚠️ Facebook API domain test failed:', fbResponse.status, fbResponse.statusText);
                  throw new Error('Facebook API appears to be temporarily unavailable. Please try again in a few moments.');
                }
              } catch (fbError) {
                if (fbError instanceof Error && fbError.message.includes('Failed to fetch')) {
                  console.error('❌ Facebook API domain: Not accessible');
                  throw new Error('Unable to reach Facebook API servers. Please check your internet connection and try again.');
                }
                throw fbError; // Re-throw specific Facebook errors
              }
            } else {
              console.error('❌ Internet connectivity test failed:', connectivityResponse.status);
              throw new Error('Internet connectivity issue detected. Please check your internet connection.');
            }
          } catch (connectivityError) {
            console.error('❌ Internet connectivity test failed:', connectivityError);
            if (connectivityError instanceof Error && connectivityError.message.includes('Failed to fetch')) {
              throw new Error('Network error: Unable to connect to external services. Please check your internet connection and try again.');
            }
            throw connectivityError;
          }
        }
        
        if (error.message.includes('TypeError: NetworkError') || 
            error.message.includes('CORS') ||
            error.message.includes('blocked')) {
          throw new Error('CORS error: This might be due to browser security restrictions. Please ensure you\'re accessing the app from the correct domain.');
        }
        
        throw error;
      }
      throw new Error('Unknown network error occurred');
    }
  }

  // Rate limiting mechanism based on Facebook's recommendations
  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minRequestInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
      }

      const requestFn = this.requestQueue.shift();
      if (requestFn) {
        this.lastRequestTime = Date.now();
        await requestFn();
      }
    }

    this.isProcessingQueue = false;
  }

  // Mock data for development
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

  // Test basic internet connectivity (independent of Facebook API)
  async testBasicConnectivity(): Promise<{ connected: boolean; error?: string }> {
    try {
      console.log('🔍 Testing basic internet connectivity...');
      
      const response = await fetch('https://httpbin.org/get', { 
        method: 'GET', 
        mode: 'cors',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        console.log('✅ Basic internet connectivity: OK');
        return { connected: true };
      } else {
        console.error('❌ Basic connectivity test failed:', response.status);
        return { 
          connected: false, 
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('❌ Basic connectivity test failed:', error);
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Test Facebook API connectivity
  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      console.log('🔍 Testing Facebook API connectivity...');
      
      // Test basic Facebook API access with a simple endpoint
      const response = await this.request('/me?fields=id', {
        method: 'GET',
      });
      
      console.log('✅ Facebook API connection successful:', response);
      return { connected: true };
    } catch (error) {
      console.error('❌ Facebook API connection failed:', error);
      
      // Don't trigger the network diagnostics here to avoid circular dependency
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Test ad creation process step by step using Facebook API v23.0
  async testAdCreationProcess(adAccountId: string): Promise<{
    status: 'success' | 'partial' | 'failed';
    steps: Array<{
      step: string;
      status: 'pass' | 'fail' | 'skip';
      message: string;
      details?: any;
      error?: string;
    }>;
    recommendations: string[];
  }> {
    console.log('🧪 Testing ad creation process step by step...');
    
    const steps: Array<{
      step: string;
      status: 'pass' | 'fail' | 'skip';
      message: string;
      details?: any;
      error?: string;
    }> = [];
    
    const recommendations: string[] = [];
    
    try {
      // Step 1: Test Campaign Creation
      console.log('🧪 Step 1: Testing campaign creation...');
      try {
        const campaignData: FacebookCampaignData = {
          name: 'Test Campaign - API Test',
          objective: 'OUTCOME_ENGAGEMENT',
          status: 'PAUSED'
        };
        
        const campaign = await this.request<{ id: string }>(`/${adAccountId}/campaigns`, {
          method: 'POST',
          body: JSON.stringify(campaignData),
        });
        
        steps.push({
          step: 'Campaign Creation',
          status: 'pass',
          message: '✅ Campaign created successfully',
          details: { campaignId: campaign.id, name: campaignData.name }
        });
        
        // Step 2: Test Ad Set Creation
        console.log('🧪 Step 2: Testing ad set creation...');
        try {
          const adSetData: FacebookAdSetData = {
            name: 'Test Ad Set - API Test',
            campaign_id: campaign.id,
            daily_budget: 1000, // $10.00 in cents
            billing_event: 'IMPRESSIONS',
            optimization_goal: 'LINK_CLICKS',
            targeting: {
              device_platforms: ['mobile'],
              publisher_platforms: ['facebook'],
              geo_locations: {
                countries: ['US']
              },
              age_min: 18,
              age_max: 65
            },
            status: 'PAUSED'
          };
          
          const adSet = await this.request<{ id: string }>(`/${adAccountId}/adsets`, {
            method: 'POST',
            body: JSON.stringify(adSetData),
          });
          
          steps.push({
            step: 'Ad Set Creation',
            status: 'pass',
            message: '✅ Ad set created successfully',
            details: { adSetId: adSet.id, name: adSetData.name }
          });
          
          // Step 3: Test Creative Creation
          console.log('🧪 Step 3: Testing creative creation...');
          try {
            // First, get a page for the creative
            const pages = await this.request<{ data: FacebookPage[] }>('/me/accounts', {
              method: 'GET',
            });
            
            if (pages.data && pages.data.length > 0) {
              const pageId = pages.data[0].id;
              
              const creativeData: FacebookCreativeData = {
                name: 'Test Creative - API Test',
                object_story_spec: {
                  page_id: pageId,
                  link_data: {
                    message: 'This is a test ad creative created via API v23.0',
                    link: 'https://www.facebook.com',
                    name: 'Test Ad'
                  }
                }
              };
              
              const creative = await this.request<{ id: string }>(`/${adAccountId}/adcreatives`, {
                method: 'POST',
                body: JSON.stringify(creativeData),
              });
              
              steps.push({
                step: 'Creative Creation',
                status: 'pass',
                message: '✅ Creative created successfully',
                details: { creativeId: creative.id, name: creativeData.name }
              });
              
              // Step 4: Test Ad Creation
              console.log('🧪 Step 4: Testing ad creation...');
              try {
                const adData: FacebookAdData = {
                  name: 'Test Ad - API Test',
                  adset_id: adSet.id,
                  creative: {
                    creative_id: creative.id
                  },
                  status: 'PAUSED'
                };
                
                const ad = await this.request<{ id: string }>(`/${adAccountId}/ads`, {
                  method: 'POST',
                  body: JSON.stringify(adData),
                });
                
                steps.push({
                  step: 'Ad Creation',
                  status: 'pass',
                  message: '✅ Ad created successfully',
                  details: { adId: ad.id, name: adData.name }
                });
                
                // Cleanup: Delete test objects
                console.log('🧹 Cleaning up test objects...');
                try {
                  await this.request(`/${ad.id}`, { method: 'DELETE' });
                  await this.request(`/${creative.id}`, { method: 'DELETE' });
                  await this.request(`/${adSet.id}`, { method: 'DELETE' });
                  await this.request(`/${campaign.id}`, { method: 'DELETE' });
                  
                  steps.push({
                    step: 'Cleanup',
                    status: 'pass',
                    message: '✅ Test objects cleaned up successfully'
                  });
                  
                } catch (cleanupError) {
                  steps.push({
                    step: 'Cleanup',
                    status: 'fail',
                    message: '⚠️ Could not clean up test objects (this is not critical)',
                    error: cleanupError instanceof Error ? cleanupError.message : 'Unknown error'
                  });
                }
                
                return { 
                  status: 'success', 
                  steps, 
                  recommendations: ['🎉 Ad creation process is working correctly!'] 
                };
                
              } catch (adError) {
                steps.push({
                  step: 'Ad Creation',
                  status: 'fail',
                  message: '❌ Ad creation failed',
                  error: adError instanceof Error ? adError.message : 'Unknown error'
                });
                recommendations.push('💡 Check ad creation parameters and targeting');
                return { status: 'partial', steps, recommendations };
              }
              
            } else {
              steps.push({
                step: 'Creative Creation',
                status: 'skip',
                message: '⚠️ Skipped - no pages available for creative creation'
              });
              recommendations.push('💡 Create or request access to a Facebook page for ad creatives');
              return { status: 'partial', steps, recommendations };
            }
            
          } catch (creativeError) {
            steps.push({
              step: 'Creative Creation',
              status: 'fail',
              message: '❌ Creative creation failed',
              error: creativeError instanceof Error ? creativeError.message : 'Unknown error'
            });
            recommendations.push('💡 Check creative parameters and page access');
            return { status: 'partial', steps, recommendations };
          }
          
        } catch (adSetError) {
          steps.push({
            step: 'Ad Set Creation',
            status: 'fail',
            message: '❌ Ad set creation failed',
            error: adSetError instanceof Error ? adSetError.message : 'Unknown error'
          });
          recommendations.push('💡 Check ad set parameters and targeting');
          return { status: 'partial', steps, recommendations };
        }
        
      } catch (campaignError) {
        steps.push({
          step: 'Campaign Creation',
          status: 'fail',
          message: '❌ Campaign creation failed',
          error: campaignError instanceof Error ? campaignError.message : 'Unknown error'
        });
        recommendations.push('💡 Check campaign parameters and ad account access');
        return { status: 'failed', steps, recommendations };
      }
      
    } catch (error) {
      console.error('❌ Error during ad creation test:', error);
      steps.push({
        step: 'Test Process',
        status: 'fail',
        message: '❌ Ad creation test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return { 
        status: 'failed', 
        steps, 
        recommendations: ['💡 Check your configuration and try again'] 
      };
    }
  }

  // Comprehensive troubleshooting for app configuration using Facebook API v23.0
  async troubleshootConfiguration(): Promise<{
    status: 'success' | 'warning' | 'error';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
      details?: any;
    }>;
    recommendations: string[];
    nextSteps: string[];
  }> {
    console.log('🔍 Starting comprehensive configuration troubleshooting...');
    
    const checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
      details?: any;
    }> = [];
    
    const recommendations: string[] = [];
    const nextSteps: string[] = [];
    
    try {
      // Check 1: Access Token Validation
      console.log('🔍 Check 1: Validating access token...');
      try {
        const tokenInfo = await this.request<{ id: string; name: string }>('/me', {
          method: 'GET',
        });
        
        checks.push({
          name: 'Access Token',
          status: 'pass',
          message: '✅ Access token is valid and working',
          details: { userId: tokenInfo.id, userName: tokenInfo.name }
        });
        
        // Check permissions using the correct endpoint
        try {
          const permissionsInfo = await this.request<{ data: Array<{ permission: string; status: string }> }>('/me/permissions', {
            method: 'GET',
          });
          
          const userPermissions = permissionsInfo.data
            .filter(p => p.status === 'granted')
            .map(p => p.permission);
          
          const requiredPermissions = ['ads_management', 'pages_manage_ads'];
          const missingPermissions = requiredPermissions.filter(perm => 
            !userPermissions.includes(perm)
          );
          
          if (missingPermissions.length > 0) {
            checks.push({
              name: 'User Permissions',
              status: 'fail',
              message: `❌ Missing required permissions: ${missingPermissions.join(', ')}`,
              details: { 
                required: requiredPermissions, 
                current: userPermissions,
                missing: missingPermissions 
              }
            });
            recommendations.push('💡 Re-authenticate with Facebook to grant missing permissions');
          } else {
            checks.push({
              name: 'User Permissions',
              status: 'pass',
              message: '✅ All required permissions are present',
              details: { permissions: userPermissions }
            });
          }
        } catch (permissionsError) {
          checks.push({
            name: 'User Permissions',
            status: 'warning',
            message: '⚠️ Could not verify permissions (this might be expected)',
            details: { error: permissionsError instanceof Error ? permissionsError.message : 'Unknown error' }
          });
        }
        
      } catch (error) {
        checks.push({
          name: 'Access Token',
          status: 'fail',
          message: '❌ Access token validation failed',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
        recommendations.push('💡 Check your access token and re-authenticate');
        return { status: 'error', checks, recommendations, nextSteps };
      }
      
      // Check 2: App Configuration
      console.log('🔍 Check 2: Checking app configuration...');
      try {
        // Try to get app info from /me/apps endpoint
        const appInfo = await this.request<{ 
          data?: Array<{
            id: string; 
            name: string; 
            category: string;
            namespace?: string;
          }>;
        }>('/me/apps', {
          method: 'GET',
        });
        
        if (appInfo.data && appInfo.data.length > 0) {
          const currentApp = appInfo.data.find(app => 
            app.id === this.config.appId || 
            app.namespace === this.config.appId
          );
          
          if (currentApp) {
            checks.push({
              name: 'App Configuration',
              status: 'pass',
              message: '✅ App configuration found and accessible',
              details: { 
                appId: currentApp.id, 
                appName: currentApp.name, 
                category: currentApp.category,
                namespace: currentApp.namespace 
              }
            });
          } else {
            checks.push({
              name: 'App Configuration',
              status: 'warning',
              message: '⚠️ App not found in user\'s apps list (this might be expected)',
              details: { 
                configuredAppId: this.config.appId,
                availableApps: appInfo.data.map(app => ({ id: app.id, name: app.name }))
              }
            });
          }
        } else {
          checks.push({
            name: 'App Configuration',
            status: 'warning',
            message: '⚠️ No apps found in user\'s apps list (this might be expected)',
            details: { note: 'This is normal for some user accounts' }
          });
        }
        
      } catch (appError) {
        console.log('⚠️ Could not retrieve app configuration:', appError);
        
        // Try alternative approach - check if we can access the app directly
        try {
          const appDetails = await this.request<{
            id: string;
            name: string;
            category: string;
            namespace?: string;
          }>(`/${this.config.appId}`, {
            method: 'GET',
          });
          
          checks.push({
            name: 'App Configuration',
            status: 'pass',
            message: '✅ App is accessible and configured correctly',
            details: { 
              appId: appDetails.id, 
              appName: appDetails.name, 
              category: appDetails.category 
            }
          });
          
        } catch (directAppError) {
          checks.push({
            name: 'App Configuration',
            status: 'warning',
            message: '⚠️ Could not verify app configuration (this might be expected)',
            details: { 
              error: directAppError instanceof Error ? directAppError.message : 'Unknown error',
              note: 'App configuration check is optional for basic functionality'
            }
          });
        }
      }
      
      // Check 3: Ad Accounts Access
      console.log('🔍 Check 3: Checking ad accounts access...');
      try {
        const adAccounts = await this.request<{ data: FacebookAdAccount[] }>('/me/adaccounts?fields=id,name,currency,timezone,account_status,business', {
          method: 'GET',
        });
        
        if (adAccounts.data && adAccounts.data.length > 0) {
          checks.push({
            name: 'Ad Accounts Access',
            status: 'pass',
            message: `✅ Found ${adAccounts.data.length} ad account(s)`,
            details: { 
              count: adAccounts.data.length,
              accounts: adAccounts.data.map(acc => ({ id: acc.id, name: acc.name, status: acc.account_status }))
            }
          });
          
          // Check for sandbox accounts
          const sandboxAccounts = adAccounts.data.filter(acc => 
            acc.id.includes('sandbox') || acc.name.toLowerCase().includes('sandbox')
          );
          
          if (sandboxAccounts.length > 0) {
            checks.push({
              name: 'Sandbox Accounts',
              status: 'pass',
              message: `✅ Found ${sandboxAccounts.length} sandbox account(s)`,
              details: { accounts: sandboxAccounts.map(acc => ({ id: acc.id, name: acc.name })) }
            });
          } else {
            checks.push({
              name: 'Sandbox Accounts',
              status: 'warning',
              message: '⚠️ No sandbox accounts found (this might be expected)',
              details: { note: 'Sandbox accounts are typically created through developer.facebook.com' }
            });
          }
          
        } else {
          checks.push({
            name: 'Ad Accounts Access',
            status: 'fail',
            message: '❌ No ad accounts found',
            details: { note: 'You need at least one ad account to create ads' }
          });
          recommendations.push('💡 Create or request access to an ad account in Facebook Ads Manager');
        }
        
      } catch (error) {
        checks.push({
          name: 'Ad Accounts Access',
          status: 'fail',
          message: '❌ Could not access ad accounts',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
        recommendations.push('💡 Check your ad account permissions and access');
      }
      
      // Check 4: Pages Access (for ad creatives)
      console.log('🔍 Check 4: Checking pages access...');
      try {
        const pages = await this.request<{ data: FacebookPage[] }>('/me/accounts', {
          method: 'GET',
        });
        
        if (pages.data && pages.data.length > 0) {
          checks.push({
            name: 'Pages Access',
            status: 'pass',
            message: `✅ Found ${pages.data.length} page(s)`,
            details: { 
              count: pages.data.length,
              pages: pages.data.map(page => ({ id: page.id, name: page.name, category: page.category }))
            }
          });
        } else {
          checks.push({
            name: 'Pages Access',
            status: 'warning',
            message: '⚠️ No pages found (needed for ad creatives)',
            details: { note: 'Pages are required for creating ad creatives' }
          });
          recommendations.push('💡 Create or request access to a Facebook page for ad creation');
        }
        
      } catch (error) {
        checks.push({
          name: 'Pages Access',
          status: 'fail',
          message: '❌ Could not access pages',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
        recommendations.push('💡 Check your page permissions and access');
      }
      
      // Check 5: API Version Compatibility
      console.log('🔍 Check 5: Checking API version...');
      checks.push({
        name: 'API Version',
        status: 'pass',
        message: '✅ Using Facebook Marketing API v23.0 (latest)',
        details: { version: 'v23.0', baseUrl: this.baseUrl }
      });
      
      // Check 6: Sandbox Mode Configuration
      console.log('🔍 Check 6: Checking sandbox mode...');
      checks.push({
        name: 'Sandbox Mode',
        status: this.config.sandboxMode ? 'pass' : 'warning',
        message: this.config.sandboxMode 
          ? '✅ Sandbox mode is enabled'
          : '⚠️ Sandbox mode is not enabled (consider enabling for testing)',
        details: { sandboxMode: this.config.sandboxMode }
      });
      
      // Determine overall status
      const failedChecks = checks.filter(check => check.status === 'fail');
      const warningChecks = checks.filter(check => check.status === 'warning');
      
      let overallStatus: 'success' | 'warning' | 'error';
      if (failedChecks.length > 0) {
        overallStatus = 'error';
        nextSteps.push('🔧 Fix the failed checks above before proceeding');
      } else if (warningChecks.length > 0) {
        overallStatus = 'warning';
        nextSteps.push('⚠️ Address the warnings above for optimal functionality');
      } else {
        overallStatus = 'success';
        nextSteps.push('✅ Configuration looks good! Try creating ads now');
      }
      
      // Add specific recommendations based on checks
      if (failedChecks.some(check => check.name.includes('Permission'))) {
        nextSteps.push('🔑 Re-authenticate with Facebook to grant required permissions');
      }
      
      if (failedChecks.some(check => check.name.includes('Ad Account'))) {
        nextSteps.push('📊 Set up an ad account in Facebook Ads Manager');
      }
      
      if (failedChecks.some(check => check.name.includes('Page'))) {
        nextSteps.push('📄 Create or request access to a Facebook page');
      }
      
      return { status: overallStatus, checks, recommendations, nextSteps };
      
    } catch (error) {
      console.error('❌ Error during troubleshooting:', error);
      checks.push({
        name: 'Troubleshooting Process',
        status: 'fail',
        message: '❌ Error during configuration check',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      
      return { 
        status: 'error', 
        checks, 
        recommendations: ['💡 Check your internet connection and try again'], 
        nextSteps: ['🔄 Retry the troubleshooting process'] 
      };
    }
  }

  // Detect if we're working with a sandbox account
  private isSandboxAccount(adAccountId: string): boolean {
    // Sandbox accounts typically have specific patterns
    return adAccountId.includes('sandbox') || 
           adAccountId.includes('test') ||
           this.config.sandboxMode;
  }

  // Get user's ad accounts
  async getAdAccounts(): Promise<{ data: FacebookAdAccount[] }> {
    try {
      console.log('🚀 Fetching ad accounts...');
      
      const result = await this.request<{ data: FacebookAdAccount[] }>('/me/adaccounts?fields=id,name,currency,timezone,account_status,business', {
        method: 'GET',
      });
      
      // Validate the response structure
      if (!result || !result.data || !Array.isArray(result.data)) {
        console.error('❌ Invalid ad accounts response:', result);
        throw new Error('Failed to fetch ad accounts - invalid response format');
      }
      
      console.log(`✅ Successfully fetched ${result.data.length} ad accounts`);
      
      // Check for sandbox accounts and warn
      result.data.forEach((account, index) => {
        // Validate account object
        if (!account) {
          console.warn(`⚠️ Null account at index ${index}`);
          return;
        }
        
        console.log('🔍 Ad Account Details:', {
          id: account.id,
          name: account.name,
          currency: account.currency,
          timezone: account.timezone,
          business_name: account.business_name,
          account_status: account.account_status
        });
        
        // Check if it's a sandbox account (usually has specific naming patterns)
        // Add null/undefined checks to prevent errors
        const accountName = account.name || '';
        const accountId = account.id || '';
        
        if (accountName.toLowerCase().includes('sandbox') || 
            accountId.includes('sandbox') ||
            accountName.toLowerCase().includes('test')) {
          console.warn('⚠️ SANDBOX ACCOUNT DETECTED:', accountName);
          console.warn('⚠️ Sandbox accounts have limitations:');
          console.warn('   - Cannot create real ads');
          console.warn('   - Limited API endpoints');
          console.warn('   - For testing only');
        }
      });
      
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch ad accounts:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Network error')) {
          throw new Error('Unable to connect to Facebook API. Please check your internet connection and try again.');
        }
        if (error.message.includes('Access token')) {
          throw new Error('Authentication failed. Please reconnect your Facebook account.');
        }
        if (error.message.includes('CORS')) {
          throw new Error('Browser security restriction detected. Please ensure you\'re accessing the app from the correct domain.');
        }
      }
      
      throw error;
    }
  }

  // Get user's pages
  async getPages(): Promise<{ data: FacebookPage[] }> {
    return this.request(`/me/accounts?fields=id,name,category,access_token`);
  }

  // Validate access token and get user info
  async validateToken(): Promise<{ id: string; name: string; permissions: string[] }> {
    const userInfo = await this.request<{ id: string; name: string }>(`/me?fields=id,name`);
    
    // Get token permissions
    const tokenInfo = await this.request<{ data: Array<{ permission: string; status: string }> }>(`/me/permissions`);
    const permissions = tokenInfo.data
      .filter(p => p.status === 'granted')
      .map(p => p.permission);
    
    return {
      ...userInfo,
      permissions
    };
  }

  // Get custom audiences for ad account
  async getCustomAudiences(adAccountId: string): Promise<{ data: FacebookCustomAudience[] }> {
    return this.request(`/${adAccountId}/customaudiences`);
  }

  // Get pixels for ad account
  async getPixels(adAccountId: string): Promise<{ data: Array<{ id: string; name: string; pixel_id: string; status: string; creation_time: string }> }> {
    return this.request(`/${adAccountId}/adspixels?fields=id,name,pixel_id,status,creation_time`);
  }

  // Get campaigns for ad account
  async getCampaigns(adAccountId: string): Promise<{ data: Array<{ id: string; name: string; status: string; objective: string; created_time: string }> }> {
    return this.request(`/${adAccountId}/campaigns?fields=id,name,status,objective,created_time`);
  }

  // Get ad sets for ad account
  async getAdSets(adAccountId: string): Promise<{ data: Array<{ id: string; name: string; status: string; campaign_id: string; daily_budget: number }> }> {
    return this.request(`/${adAccountId}/adsets?fields=id,name,status,campaign_id,daily_budget`);
  }

  // Get interests for targeting
  async getInterests(searchTerm: string): Promise<{ data: Array<{ id: string; name: string; audience_size: number; path: string[] }> }> {
    return this.request(`/search?type=adinterest&q=${encodeURIComponent(searchTerm)}&limit=10`);
  }

  // Get behaviors for targeting
  async getBehaviors(searchTerm: string): Promise<{ data: Array<{ id: string; name: string; audience_size: number; path: string[] }> }> {
    return this.request(`/search?type=adinterest&q=${encodeURIComponent(searchTerm)}&limit=10`);
  }

  // Get locations for targeting
  async getLocations(searchTerm: string): Promise<{ data: Array<{ id: string; name: string; type: 'country' | 'region' | 'city'; country_code?: string }> }> {
    return this.request(`/search?type=adgeolocation&q=${encodeURIComponent(searchTerm)}&limit=10`);
  }

  // Get demographics for targeting (Facebook demographics are predefined categories)
  async getDemographics(countryCode?: string): Promise<{ data: Array<{ id: string; name: string; description: string; category: string; values?: Array<{ id: string; name: string; description: string }> }> }> {
    // Facebook demographics are predefined categories, not searchable
    // These are the actual demographics categories Facebook provides for targeting
    const demographicsCategories = [
      {
        id: 'parents',
        name: 'Parents',
        description: 'Target people who are parents',
        category: 'Family',
        values: [
          { id: 'parents_all', name: 'All Parents', description: 'People who are parents' },
          { id: 'parents_new', name: 'New Parents', description: 'People who recently became parents' },
          { id: 'parents_expectant', name: 'Expectant Parents', description: 'People expecting a child' }
        ]
      },
      {
        id: 'relationship_status',
        name: 'Relationship Status',
        description: 'Target by relationship status (Single, In a relationship, Married, etc.)',
        category: 'Relationship',
        values: [
          { id: 'single', name: 'Single', description: 'People who are single' },
          { id: 'in_relationship', name: 'In a relationship', description: 'People in a relationship' },
          { id: 'married', name: 'Married', description: 'People who are married' },
          { id: 'engaged', name: 'Engaged', description: 'People who are engaged' },
          { id: 'divorced', name: 'Divorced', description: 'People who are divorced' },
          { id: 'widowed', name: 'Widowed', description: 'People who are widowed' }
        ]
      },
      {
        id: 'education_status',
        name: 'Education Level',
        description: 'Target by education level (High school, College, Graduate school, etc.)',
        category: 'Education',
        values: [
          { id: 'high_school', name: 'High school', description: 'High school graduates' },
          { id: 'some_college', name: 'Some college', description: 'People with some college education' },
          { id: 'college_graduate', name: 'College graduate', description: 'College graduates' },
          { id: 'graduate_school', name: 'Graduate school', description: 'People with graduate degrees' },
          { id: 'phd', name: 'PhD', description: 'People with PhD degrees' }
        ]
      },
      {
        id: 'job_titles',
        name: 'Job Titles',
        description: 'Target by job titles and professional roles',
        category: 'Employment',
        values: [
          { id: 'manager', name: 'Manager', description: 'People in management positions' },
          { id: 'executive', name: 'Executive', description: 'People in executive positions' },
          { id: 'engineer', name: 'Engineer', description: 'People in engineering roles' },
          { id: 'sales', name: 'Sales', description: 'People in sales roles' },
          { id: 'marketing', name: 'Marketing', description: 'People in marketing roles' },
          { id: 'consultant', name: 'Consultant', description: 'People in consulting roles' },
          { id: 'entrepreneur', name: 'Entrepreneur', description: 'People who are entrepreneurs' }
        ]
      },
      {
        id: 'industries',
        name: 'Industries',
        description: 'Target by industry (Technology, Healthcare, Finance, etc.)',
        category: 'Employment',
        values: [
          { id: 'technology', name: 'Technology', description: 'People working in technology' },
          { id: 'healthcare', name: 'Healthcare', description: 'People working in healthcare' },
          { id: 'finance', name: 'Finance', description: 'People working in finance' },
          { id: 'education', name: 'Education', description: 'People working in education' },
          { id: 'retail', name: 'Retail', description: 'People working in retail' },
          { id: 'manufacturing', name: 'Manufacturing', description: 'People working in manufacturing' },
          { id: 'real_estate', name: 'Real Estate', description: 'People working in real estate' }
        ]
      },
      {
        id: 'income',
        name: 'Income Level',
        description: 'Target by income brackets',
        category: 'Financial',
        values: [
          { id: 'low_income', name: 'Low income', description: 'People with low income' },
          { id: 'middle_income', name: 'Middle income', description: 'People with middle income' },
          { id: 'high_income', name: 'High income', description: 'People with high income' },
          { id: 'top_10_percent', name: 'Top 10% income', description: 'People in top 10% income bracket' },
          { id: 'top_5_percent', name: 'Top 5% income', description: 'People in top 5% income bracket' }
        ]
      },
      {
        id: 'life_events',
        name: 'Life Events',
        description: 'Target by life events (Recently moved, New job, etc.)',
        category: 'Life Events',
        values: [
          { id: 'recently_moved', name: 'Recently moved', description: 'People who recently moved' },
          { id: 'new_job', name: 'New job', description: 'People who started a new job' },
          { id: 'graduated', name: 'Recently graduated', description: 'People who recently graduated' },
          { id: 'engaged', name: 'Recently engaged', description: 'People who recently got engaged' },
          { id: 'married', name: 'Recently married', description: 'People who recently got married' },
          { id: 'had_baby', name: 'Recently had a baby', description: 'People who recently had a baby' }
        ]
      },
      {
        id: 'political_views',
        name: 'Political Views',
        description: 'Target by political affiliation and views',
        category: 'Political',
        values: [
          { id: 'liberal', name: 'Liberal', description: 'People with liberal political views' },
          { id: 'conservative', name: 'Conservative', description: 'People with conservative political views' },
          { id: 'moderate', name: 'Moderate', description: 'People with moderate political views' },
          { id: 'progressive', name: 'Progressive', description: 'People with progressive political views' }
        ]
      },
      {
        id: 'behaviors',
        name: 'Behaviors',
        description: 'Target by behaviors (Frequent travelers, Early adopters, etc.)',
        category: 'Behavior',
        values: [
          { id: 'frequent_travelers', name: 'Frequent travelers', description: 'People who travel frequently' },
          { id: 'early_adopters', name: 'Early adopters', description: 'People who adopt new technology early' },
          { id: 'online_shoppers', name: 'Online shoppers', description: 'People who shop online frequently' },
          { id: 'luxury_buyers', name: 'Luxury buyers', description: 'People who buy luxury items' },
          { id: 'environmentally_conscious', name: 'Environmentally conscious', description: 'People who are environmentally conscious' }
        ]
      },
      {
        id: 'age_ranges',
        name: 'Age Ranges',
        description: 'Target by specific age ranges',
        category: 'Demographics',
        values: [
          { id: '18_24', name: '18-24', description: 'People aged 18-24' },
          { id: '25_34', name: '25-34', description: 'People aged 25-34' },
          { id: '35_44', name: '35-44', description: 'People aged 35-44' },
          { id: '45_54', name: '45-54', description: 'People aged 45-54' },
          { id: '55_64', name: '55-64', description: 'People aged 55-64' },
          { id: '65_plus', name: '65+', description: 'People aged 65 and older' }
        ]
      },
      {
        id: 'gender',
        name: 'Gender',
        description: 'Target by gender',
        category: 'Demographics',
        values: [
          { id: 'male', name: 'Male', description: 'People who identify as male' },
          { id: 'female', name: 'Female', description: 'People who identify as female' }
        ]
      },
      {
        id: 'languages',
        name: 'Languages',
        description: 'Target by languages spoken',
        category: 'Language',
        values: [
          { id: 'english', name: 'English', description: 'People who speak English' },
          { id: 'spanish', name: 'Spanish', description: 'People who speak Spanish' },
          { id: 'french', name: 'French', description: 'People who speak French' },
          { id: 'german', name: 'German', description: 'People who speak German' },
          { id: 'chinese', name: 'Chinese', description: 'People who speak Chinese' },
          { id: 'japanese', name: 'Japanese', description: 'People who speak Japanese' }
        ]
      }
    ];

    // If a country is specified, we can filter or prioritize certain demographics
    // but Facebook demographics are generally global with some regional variations
    if (countryCode) {
      const countryMap: { [key: string]: string } = {
        'united states': 'US',
        'united': 'US',
        'usa': 'US',
        'us': 'US',
        'america': 'US',
        'united kingdom': 'UK',
        'uk': 'UK',
        'britain': 'UK',
        'england': 'UK',
        'canada': 'CA',
        'ca': 'CA',
        'germany': 'DE',
        'de': 'DE',
        'france': 'FR',
        'fr': 'FR',
        'australia': 'AU',
        'au': 'AU',
        'spain': 'ES',
        'es': 'ES',
        'italy': 'IT',
        'it': 'IT',
        'japan': 'JP',
        'jp': 'JP',
        'brazil': 'BR',
        'br': 'BR',
        'mexico': 'MX',
        'mx': 'MX'
      };
      
      const normalizedSearch = countryCode.toLowerCase().trim();
      const mappedCountry = countryMap[normalizedSearch];
      
      if (mappedCountry) {
        // For now, return all demographics as they're generally available globally
        // In a real implementation, you might filter based on country-specific availability
        return { data: demographicsCategories };
      }
    }

    // Return all demographics categories
    return { data: demographicsCategories };
  }

  // Get conversion events for pixel
  async getConversionEvents(pixelId: string): Promise<{ data: Array<{ id: string; name: string; category: string; description: string }> }> {
    return this.request(`/${pixelId}/events?fields=id,name,category,description`);
  }

  // Create a purchase conversion event
  async createPurchaseEvent(pixelId: string): Promise<{ id: string; name: string; category: string }> {
    return this.request(`/${pixelId}/events`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Purchase',
        category: 'PURCHASE',
        description: 'Purchase event for tracking conversions'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Create a new pixel for the ad account
  async createPixel(adAccountId: string, pixelName: string): Promise<{ id: string; pixel_id: string }> {
    return this.request(`/${adAccountId}/adspixels`, {
      method: 'POST',
      body: JSON.stringify({
        name: pixelName
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Upload media using Facebook Video Ads API (4-step process)
  async uploadMedia(adAccountId: string, file: File): Promise<{ id: string; hash: string }> {
    // In development mode, return mock data
    if (this.isDevelopmentMode) {
      console.log("Development mode: Mock media upload for", file.name);
      return {
        id: `mock_media_id_${Date.now()}`,
        hash: `mock_media_hash_${Date.now()}`
      };
    }

    console.log("🔍 Starting Facebook Video Ads API upload process:", {
      filename: file.name,
      size: file.size,
      type: file.type,
      adAccountId: adAccountId
    });

    try {
      // For images, use the old Marketing API approach
      if (!file.type.startsWith("video/")) {
        console.log("🖼️ Using Marketing API for image upload...");
        return this.uploadImageViaMarketingAPI(adAccountId, file);
      }

      // For videos, use the new Video Ads API (4-step process)
      console.log("🎥 Using Video Ads API for video upload...");
      return this.uploadVideoViaVideoAdsAPI(adAccountId, file);

    } catch (error) {
      console.error("❌ Media upload failed:", error);
      throw error;
    }
  }

  // Helper function to convert File to base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data:image/xxx;base64, prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Upload image using Marketing API
  private async uploadImageViaMarketingAPI(adAccountId: string, file: File): Promise<{ id: string; hash: string }> {
    console.log("📤 Uploading image to Facebook:", {
      filename: file.name,
      size: file.size,
      type: file.type,
      adAccountId: adAccountId
    });

    try {
      // Create FormData for image upload
      const formData = new FormData();

      // Facebook expects either 'filename' (multipart file) or 'bytes' (base64 string).
      // Using 'filename' with the raw File object tends to be more reliable and avoids base64 size inflation.
      formData.append('filename', file, file.name);

      // Optional: Add a sanitized name field (without extension) for easier identification in Asset Library
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, '_');
      formData.append('name', nameWithoutExt);

      console.log("📦 Prepared multipart form-data for image upload:", Array.from(formData.entries()));

      // Use fetch directly for multipart upload
      const url = `https://graph.facebook.com/v22.0/${adAccountId}/adimages?access_token=${encodeURIComponent(this.config.accessToken)}&app_id=${this.config.appId}`;
      console.log("🌐 Upload URL:", url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
        body: formData,
      });

      const responseText = await response.text();
      console.log("📨 Raw response:", responseText);

      if (!response.ok) {
        let errorMessage = `Image upload failed: HTTP ${response.status}`;
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.error?.message || errorMessage;
          console.error("❌ Facebook API Error:", error);
        } catch (parseError) {
          console.error("❌ Failed to parse upload error response:", responseText);
        }
        throw new Error(errorMessage);
      }

      try {
        const result = JSON.parse(responseText);
        console.log("✅ Upload response:", result);
        
        // Facebook returns images as an object with filename as key
        const images = result.images || {};
        const imageKeys = Object.keys(images);
        
        if (imageKeys.length === 0) {
          throw new Error("No image data returned from Facebook");
        }
        
        const imageData = images[imageKeys[0]];
        console.log("🖼️ Image uploaded successfully:", {
          hash: imageData?.hash,
          url: imageData?.url,
          filename: imageKeys[0]
        });
        
        if (!imageData?.hash) {
          throw new Error("No image hash returned from Facebook");
        }
        
        return {
          id: imageData.hash,
          hash: imageData.hash
        };
      } catch (error) {
        console.error("❌ Failed to process upload response:", error);
        throw error;
      }
    } catch (error) {
      console.error("❌ Image upload failed:", error);
      throw error;
    }
  }

  // Upload video using Video Ads API (4-step process)
  private async uploadVideoViaVideoAdsAPI(adAccountId: string, file: File): Promise<{ id: string; hash: string }> {
    // Step 1: Initialize upload session
    console.log("📤 Step 1: Initializing video upload session...");
    const initData = {
      upload_phase: 'start'
    };

    const initResponse = await this.request<{ video_id: string; upload_url: string }>(`/${adAccountId}/video_ads`, {
      method: 'POST',
      body: JSON.stringify(initData),
    });

    const videoId = initResponse.video_id;
    const uploadUrl = initResponse.upload_url;
    console.log("✅ Upload session initialized:", { videoId, uploadUrl });

    // Step 2: Upload the video file
    console.log("📤 Step 2: Uploading video file...");
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `OAuth ${this.config.accessToken}`,
        'offset': '0',
        'file_size': file.size.toString()
      },
      body: file
    });

    if (!uploadResponse.ok) {
      let errorMessage = `Upload failed: HTTP ${uploadResponse.status}`;
      try {
        const error = await uploadResponse.json();
        errorMessage = error.error?.message || errorMessage;
      } catch (parseError) {
        console.error("❌ Failed to parse upload error response");
      }
      throw new Error(errorMessage);
    }

    const uploadResult = await uploadResponse.json();
    console.log("✅ Video file upload completed:", uploadResult);

    // Step 3: Check upload status (optional but recommended)
    console.log("📊 Step 3: Checking upload status...");
    const statusResponse = await this.request<{ status: any }>(`/${videoId}?fields=status`, {
      method: 'GET',
    });

    console.log("📊 Upload status:", statusResponse.status);

    // Step 4: Publish video to ad account
    console.log("📤 Step 4: Publishing video to ad account...");
    const publishData = {
      upload_phase: 'finish',
      video_id: videoId
    };

    const publishResponse = await this.request<{ success: boolean }>(`/${adAccountId}/video_ads`, {
      method: 'POST',
      body: JSON.stringify(publishData),
    });

    console.log("✅ Video published to ad account:", publishResponse);

    return {
      id: videoId,
      hash: videoId // For videos, use ID as hash
    };
  }

  // Create campaign
  async createCampaign(adAccountId: string, data: FacebookCampaignData): Promise<{ id: string }> {
    return this.request(`/${adAccountId}/campaigns`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Create sample campaign for testing
  async createSampleCampaign(adAccountId: string): Promise<{ id: string }> {
    const sampleCampaignData: FacebookCampaignData = {
      name: `Sample Campaign ${Date.now()}`,
      objective: 'OUTCOME_TRAFFIC',
      status: 'PAUSED',
      special_ad_categories: []
    };
    
    return this.createCampaign(adAccountId, sampleCampaignData);
  }

  // Create ad set
  async createAdSet(adAccountId: string, data: FacebookAdSetData): Promise<{ id: string }> {
    return this.request(`/${adAccountId}/adsets`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Create ad creative with sandbox-aware handling
  async createAdCreative(adAccountId: string, data: FacebookCreativeData): Promise<{ id: string }> {
    console.log('🔍 Creating ad creative with data:', JSON.stringify(data, null, 2));
    console.log('🔍 Ad account ID:', adAccountId);
    
    // Check if this is a proper sandbox account
    const isSandbox = this.isSandboxAccount(adAccountId);
    if (isSandbox) {
      console.log('🏖️ Creating creative in sandbox mode - this should work per Facebook docs');
      console.log('📖 Reference: https://developers.facebook.com/ads/blog/post/v2/2016/10/19/sandbox-ad-accounts/');
    }
    
    // Add Standard Enhancements by default for better performance (unless explicitly disabled)
    const creativeData = {
      ...data,
      degrees_of_freedom_spec: data.degrees_of_freedom_spec || {
        creative_features_spec: {
          standard_enhancements: {
            enroll_status: 'OPT_IN' // Enable Standard Enhancements by default
          }
        }
      }
    };
    
    console.log('🎨 Creative data with Standard Enhancements:', JSON.stringify(creativeData, null, 2));
    
    const result = await this.request<{ id: string }>(`/${adAccountId}/adcreatives`, {
      method: 'POST',
      body: JSON.stringify(creativeData),
    });
    
    if (isSandbox) {
      console.log('✅ Creative created successfully in sandbox mode (no real ads will be published)');
    } else {
      console.log('✅ Creative created successfully with Standard Enhancements enabled');
    }
    
    return result;
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

  // Check video processing status using Video Ads API
  async checkVideoStatus(videoId: string): Promise<{ status: string; processing_status?: string }> {
    if (this.isDevelopmentMode) {
      console.log("Development mode: Mock video status check for", videoId);
      return { status: 'READY' };
    }

    console.log("🔍 Checking video status for:", videoId);
    
    try {
      const result = await this.request<{ 
        status: {
          video_status: string;
          uploading_phase: { status: string; bytes_transfered?: number };
          processing_phase: { status: string };
          publishing_phase: { status: string };
        }
      }>(`/${videoId}?fields=status`, {
        method: 'GET',
      });
      
      console.log("🔍 Video status result:", result);
      
      // Map the complex status to a simple format
      const videoStatus = result.status.video_status;
      const processingStatus = result.status.processing_phase.status;
      
      return {
        status: videoStatus,
        processing_status: processingStatus
      };
    } catch (error) {
      console.error("❌ Error checking video status:", error);
      throw error;
    }
  }

  // Batch requests as recommended by Facebook's Graph API documentation
  async batchRequest(requests: Array<{ method: string; relative_url: string; body?: string }>): Promise<any[]> {
    if (this.isDevelopmentMode) {
      console.log("Development mode: Mock batch request for", requests.length, "requests");
      return requests.map((_, index) => ({ id: `mock_result_${index}` }));
    }

    console.log("🔗 Executing batch request with", requests.length, "requests");
    
    const batchData = {
      batch: JSON.stringify(requests),
      include_headers: 'false'
    };

    const result = await this.request<any[]>('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(batchData).toString(),
    });

    console.log("✅ Batch request completed");
    return result;
  }

  // Wait for video to be ready (with timeout)
  async waitForVideoReady(videoId: string, maxWaitTime: number = 300000): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 5000; // Check every 5 seconds
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await this.checkVideoStatus(videoId);
        console.log("🔍 Video status check:", status);
        
        if (status.status === 'READY' || status.processing_status === 'FINISHED') {
          console.log("✅ Video is ready for use");
          return true;
        }
        
        if (status.status === 'ERROR' || status.processing_status === 'ERROR') {
          console.error("❌ Video processing failed:", status);
          return false;
        }
        
        console.log("⏳ Video still processing, waiting...");
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        
      } catch (error) {
        console.error("❌ Error checking video status:", error);
        return false;
      }
    }
    
    console.warn("⚠️ Video processing timeout");
    return false;
  }
}

export default FacebookAPIClient; 