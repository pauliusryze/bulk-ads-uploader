import { useState, useEffect } from 'react';
import FacebookAPIClient, { 
  FacebookAPIConfig, 
  FacebookAdAccount, 
  FacebookPage,
  FacebookCustomAudience 
} from '../lib/facebook-api';
import { FacebookAuthResponse } from '../types/facebook';

export interface FacebookAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  adAccounts: FacebookAdAccount[];
  pages: FacebookPage[];
  selectedAdAccount: FacebookAdAccount | null;
  selectedPage: FacebookPage | null;
  customAudiences: FacebookCustomAudience[];
  pixels: Array<{ id: string; name: string; pixel_id: string; status: string; creation_time: string }>;
  campaigns: Array<{ id: string; name: string; status: string; objective: string; created_time: string }>;
  isLoading: boolean;
  error: string | null;
}

export const useFacebookAuth = () => {
  const [authState, setAuthState] = useState<FacebookAuthState>({
    isAuthenticated: false,
    accessToken: null,
    adAccounts: [],
    pages: [],
    selectedAdAccount: null,
    selectedPage: null,
    customAudiences: [],
    pixels: [],
    campaigns: [],
    isLoading: false,
    error: null,
  });

  const [apiClient, setApiClient] = useState<FacebookAPIClient | null>(null);

  // Manual access token state
  const [manualAccessToken, setManualAccessToken] = useState('');

  // Initialize Facebook SDK
  useEffect(() => {
    // In development mode, skip Facebook SDK loading to use mock mode
    if (process.env.NODE_ENV === 'development' && window.location.protocol === 'http:') {
      console.log('Development mode: Skipping Facebook SDK loading, using mock mode');
      return;
    }

    const initFacebookSDK = () => {
      if (window.FB) {
        window.FB.init({
          appId: process.env.REACT_APP_FACEBOOK_APP_ID || 'your-app-id',
          cookie: true,
          xfbml: true,
          version: 'v22.0',
        });
      }
    };

    // Load Facebook SDK only in production or HTTPS
    if (!window.FB) {
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.onload = initFacebookSDK;
      document.head.appendChild(script);
    } else {
      initFacebookSDK();
    }
  }, []);

  // Facebook Login
  const login = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if we're in development mode and Facebook SDK isn't available
      if (process.env.NODE_ENV === 'development' && (window.location.protocol === 'http:' || !window.FB)) {
        // Mock login for development
        console.log('Development mode: Using mock Facebook login');
        
        // Simulate successful login
        const mockAccessToken = 'mock-access-token-for-development';
        const mockAdAccounts = [
          { id: 'act_123456789', name: 'Test Ad Account', currency: 'USD', timezone: 'America/New_York' }
        ];
        const mockPages = [
          { id: '123456789', name: 'Test Page', category: 'Business', access_token: 'mock-page-token' }
        ];

        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          accessToken: mockAccessToken,
          adAccounts: mockAdAccounts,
          pages: mockPages,
          isLoading: false,
        }));

        // Create mock API client
        const mockClient = new FacebookAPIClient({
          appId: 'mock-app-id',
          accessToken: mockAccessToken,
          adAccountId: mockAdAccounts[0].id,
          sandboxMode: true,
        });

        setApiClient(mockClient);
        return;
      }

      const response = await new Promise<{ authResponse: { accessToken: string } }>((resolve, reject) => {
        window.FB.login((response) => {
          if (response.authResponse) {
            resolve(response as { authResponse: { accessToken: string } });
          } else {
            reject(new Error('Facebook login failed'));
          }
        }, {
          scope: 'ads_management,pages_read_engagement,pages_manage_ads',
          return_scopes: true,
        });
      });

      const { accessToken } = response.authResponse;
      
      // Initialize API client
      const client = new FacebookAPIClient({
        appId: process.env.REACT_APP_FACEBOOK_APP_ID || 'your-app-id',
        accessToken,
        adAccountId: '', // Will be set when user selects an ad account
        sandboxMode: true, // Start in sandbox mode for safety
      });

      setApiClient(client);

      // Get user's ad accounts and pages
      const [adAccountsResponse, pagesResponse] = await Promise.all([
        client.getAdAccounts(),
        client.getPages(),
      ]);

      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        accessToken,
        adAccounts: adAccountsResponse.data,
        pages: pagesResponse.data,
        isLoading: false,
      }));

    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
    }
  };

  // Logout
  const logout = (): void => {
    if (window.FB) {
      window.FB.logout(() => {
        setAuthState({
          isAuthenticated: false,
          accessToken: null,
          adAccounts: [],
          pages: [],
          selectedAdAccount: null,
          selectedPage: null,
          customAudiences: [],
          pixels: [],
          campaigns: [],
          isLoading: false,
          error: null,
        });
        setApiClient(null);
      });
    } else {
      // Mock logout for development
      setAuthState({
        isAuthenticated: false,
        accessToken: null,
        adAccounts: [],
        pages: [],
        selectedAdAccount: null,
        selectedPage: null,
        customAudiences: [],
        pixels: [],
        campaigns: [],
        isLoading: false,
        error: null,
      });
      setApiClient(null);
    }
  };

  // Create sample campaign for testing
  const createSampleCampaign = async (): Promise<void> => {
    if (!apiClient || !authState.selectedAdAccount) return;

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await apiClient.createSampleCampaign(authState.selectedAdAccount.id);
      
      // Refresh campaigns list
      const campaignsResponse = await apiClient.getCampaigns(authState.selectedAdAccount.id);
      
      setAuthState(prev => ({
        ...prev,
        campaigns: campaignsResponse.data || [],
        isLoading: false,
      }));

      console.log('Sample campaign created:', result);
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create sample campaign',
      }));
    }
  };

  // Get interests for targeting
  const getInterests = async (searchTerm: string): Promise<Array<{ id: string; name: string; audience_size: number; path: string[] }>> => {
    if (!apiClient) return [];
    
    try {
      const response = await apiClient.getInterests(searchTerm);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch interests:', error);
      return [];
    }
  };

  // Get behaviors for targeting
  const getBehaviors = async (searchTerm: string): Promise<Array<{ id: string; name: string; audience_size: number; path: string[] }>> => {
    if (!apiClient) return [];
    
    try {
      const response = await apiClient.getBehaviors(searchTerm);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch behaviors:', error);
      return [];
    }
  };

  // Get demographics for targeting
  const getDemographics = async (): Promise<Array<{ id: string; name: string; description: string }>> => {
    if (!apiClient) return [];
    
    try {
      const response = await apiClient.getDemographics();
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch demographics:', error);
      return [];
    }
  };

  // Get conversion events for pixel
  const getConversionEvents = async (pixelId: string): Promise<Array<{ id: string; name: string; category: string; description: string }>> => {
    if (!apiClient) return [];
    
    try {
      const response = await apiClient.getConversionEvents(pixelId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch conversion events:', error);
      return [];
    }
  };

  // Select ad account
  const selectAdAccount = async (adAccount: FacebookAdAccount): Promise<void> => {
    if (!apiClient) return;

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Update API client with selected ad account
      const updatedClient = new FacebookAPIClient({
        appId: process.env.REACT_APP_FACEBOOK_APP_ID || 'your-app-id',
        accessToken: authState.accessToken!,
        adAccountId: adAccount.id,
        sandboxMode: true,
      });

      setApiClient(updatedClient);

      // Get custom audiences, pixels, and campaigns for this ad account
      const [customAudiencesResponse, pixelsResponse, campaignsResponse] = await Promise.all([
        updatedClient.getCustomAudiences(adAccount.id),
        updatedClient.getPixels(adAccount.id),
        updatedClient.getCampaigns(adAccount.id),
      ]);

      console.log('Pixels Response:', pixelsResponse);
      console.log('Campaigns Response:', campaignsResponse);

      setAuthState(prev => ({
        ...prev,
        selectedAdAccount: adAccount,
        customAudiences: customAudiencesResponse.data,
        pixels: pixelsResponse.data || [],
        campaigns: campaignsResponse.data || [],
        isLoading: false,
      }));

    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load ad account data',
      }));
    }
  };

  // Select page
  const selectPage = (page: FacebookPage): void => {
    setAuthState(prev => ({
      ...prev,
      selectedPage: page,
    }));
  };

  // Manual token handler
  const handleManualToken = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      console.log('🔍 Starting manual token authentication...');
      
      const client = new FacebookAPIClient({
        appId: process.env.REACT_APP_FACEBOOK_APP_ID || 'your-app-id',
        accessToken: manualAccessToken,
        adAccountId: '',
        sandboxMode: true,
      });
      
      // Validate token first
      console.log('🔍 Validating access token...');
      const tokenValidation = await client.validateToken();
      console.log('✅ Token validation successful:', tokenValidation);
      
      setApiClient(client);
      
      // Test connection before fetching data
      console.log('🔍 Testing Facebook API connection...');
      const connectionTest = await client.testConnection();
      if (!connectionTest.connected) {
        console.error('❌ Connection test failed:', connectionTest.error);
        throw new Error(`Connection test failed: ${connectionTest.error}`);
      }
      console.log('✅ Connection test successful');
      
      console.log('🔍 Fetching ad accounts and pages...');
      
      // Get user's ad accounts and pages
      const [adAccountsResponse, pagesResponse] = await Promise.all([
        client.getAdAccounts().catch(error => {
          console.error('❌ Error fetching ad accounts:', error);
          return { data: [] };
        }),
        client.getPages().catch(error => {
          console.error('❌ Error fetching pages:', error);
          return { data: [] };
        }),
      ]);
      
      console.log('📊 Ad Accounts Response:', adAccountsResponse);
      console.log('📄 Pages Response:', pagesResponse);
      console.log('🔍 Pages data specifically:', pagesResponse.data);
      console.log('🔍 Number of pages found:', pagesResponse.data?.length || 0);
      
      if (!pagesResponse.data || pagesResponse.data.length === 0) {
        console.warn('⚠️ No pages found in the response. This could be due to:');
        console.warn('   1. Token lacks pages_read_engagement permission');
        console.warn('   2. No pages associated with this Facebook account');
        console.warn('   3. Pages need to be manually granted to the app');
        console.warn('   4. API call failed silently');
      }
      
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        accessToken: manualAccessToken,
        adAccounts: adAccountsResponse.data || [],
        pages: pagesResponse.data || [],
        isLoading: false,
      }));
      
      console.log('✅ Authentication state updated successfully');
      console.log('📊 Final pages in state:', pagesResponse.data || []);
      
      // Clear the manual token input for security
      setManualAccessToken('');
      
    } catch (error) {
      console.error('❌ Manual token authentication failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Token authentication failed',
      }));
    }
  };

  return {
    ...authState,
    apiClient,
    login,
    logout,
    selectAdAccount,
    selectPage,
    manualAccessToken,
    setManualAccessToken,
    handleManualToken,
    createSampleCampaign,
    getInterests,
    getBehaviors,
    getDemographics,
    getConversionEvents,
  };
}; 