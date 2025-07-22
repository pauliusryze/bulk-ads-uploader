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
  billing_event: 'IMPRESSIONS' | 'LINK_CLICKS';
  optimization_goal: 'LINK_CLICKS' | 'CONVERSIONS' | 'REACH' | 'BRAND_AWARENESS' | 'VIDEO_VIEWS' | 'OUTCOME_TRAFFIC' | 'OUTCOME_ENGAGEMENT' | 'OUTCOME_LEADS' | 'OUTCOME_SALES' | 'OUTCOME_APP_PROMOTION';
  bid_strategy?: 'LOWEST_COST_WITHOUT_CAP' | 'LOWEST_COST_WITH_BID_CAP' | 'COST_CAP' | 'BID_CAP' | 'ABSOLUTE_OCPM';
  bid_amount?: number;
  targeting: {
    // Modern targeting fields (replacing deprecated ones)
    age_min?: number;
    age_max?: number;
    genders?: number[];
    
    // Updated geo targeting structure
    geo_locations?: {
      countries?: string[];
      regions?: Array<{ key: string; name: string }>;
      cities?: Array<{ key: string; name: string; radius: number; distance_unit: 'mile' | 'kilometer' }>;
      zips?: Array<{ key: string; name: string }>;
    };
    
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
    
    // Placement targeting
    publisher_platforms?: ('facebook' | 'instagram' | 'audience_network' | 'messenger')[];
    facebook_positions?: ('feed' | 'instant_article' | 'marketplace' | 'video_feeds' | 'story' | 'reels')[];
    instagram_positions?: ('story' | 'feed' | 'explore' | 'reels')[];
    
    // Language targeting
    locales?: number[];
    
    // Device targeting
    device_platforms?: ('desktop' | 'mobile' | 'connected_tv')[];
    
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
  private baseUrl = 'https://graph.facebook.com/v22.0';
  private isDevelopmentMode: boolean;

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
    const params = new URLSearchParams({
      access_token: this.config.accessToken,
    });

    // Check if endpoint already has query parameters
    const separator = endpoint.includes('?') ? '&' : '?';
    const fullUrl = `${url}${separator}${params}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FacebookAdsUploader/1.0',
        ...options.headers,
      },
      ...options,
    };

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

            // Provide specific error messages based on error codes
            if (error.code === 100) {
              // Invalid parameter errors
              const errorMsg = error.message.toLowerCase();
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
        if (error.name === 'AbortError') {
          throw new Error('Request timeout: The request took too long to complete.');
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Network error: Unable to connect to Facebook API. Please check your internet connection.');
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
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
    return this.request(`/me/adaccounts?fields=id,name,currency,timezone,account_status,business`);
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

  // Upload media to Facebook
  async uploadMedia(adAccountId: string, file: File): Promise<{ id: string; hash: string }> {
    // In development mode, return mock data
    if (this.isDevelopmentMode) {
      console.log("Development mode: Mock media upload for", file.name);
      return {
        id: `mock_media_id_${Date.now()}`,
        hash: `mock_media_hash_${Date.now()}`
      };
    }

    console.log("🔍 Uploading media to Facebook:", {
      filename: file.name,
      size: file.size,
      type: file.type,
      adAccountId: adAccountId
    });

    const formData = new FormData();
    formData.append("source", file);
    
    // Use different endpoints for images vs videos
    const endpoint = file.type.startsWith("video/") 
      ? `/${adAccountId}/advideos`  // For videos
      : `/${adAccountId}/adimages`; // For images

    const url = `${this.baseUrl}${endpoint}?access_token=${this.config.accessToken}`;
    console.log("🔍 Facebook API URL:", url);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      // Dont set Content-Type - let browser set it for FormData
    });

    console.log("🔍 Facebook API Response Status:", response.status);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const error: FacebookAPIError = await response.json();
        errorMessage = error.error.message;
        console.error("❌ Facebook media upload error:", error);
      } catch (parseError) {
        console.error("❌ Failed to parse Facebook error response");
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("✅ Facebook media upload success:", result);
    
    // Facebook returns different response formats for images vs videos
    if (file.type.startsWith("video/")) {
      return {
        id: result.id,
        hash: result.id // For videos, use ID as hash
      };
    } else {
      // For images, Facebook returns { images: { filename: { hash: "..." } } }
      const imageData = result.images && result.images[Object.keys(result.images)[0]];
      return {
        id: imageData?.hash || result.id,
        hash: imageData?.hash || result.id
      };
    }
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