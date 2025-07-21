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
    isLoading: false,
    error: null,
  });

  const [apiClient, setApiClient] = useState<FacebookAPIClient | null>(null);

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
          version: 'v18.0',
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
        isLoading: false,
        error: null,
      });
      setApiClient(null);
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

      // Get custom audiences for this ad account
      const customAudiencesResponse = await updatedClient.getCustomAudiences(adAccount.id);

      setAuthState(prev => ({
        ...prev,
        selectedAdAccount: adAccount,
        customAudiences: customAudiencesResponse.data,
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

  return {
    ...authState,
    apiClient,
    login,
    logout,
    selectAdAccount,
    selectPage,
  };
}; 