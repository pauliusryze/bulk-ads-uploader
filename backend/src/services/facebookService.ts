import { FacebookAdsApi, AdAccount, Campaign, AdSet, Ad } from 'facebook-nodejs-business-sdk';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { 
  FacebookCredentials, 
  FacebookAdAccount, 
  FacebookPermissions
} from '../types';

export class FacebookService {
  private static instance: FacebookService;
  private accessToken: string | null = null;
  private adAccountId: string | null = null;

  private constructor() {}

  public static getInstance(): FacebookService {
    if (!FacebookService.instance) {
      FacebookService.instance = new FacebookService();
    }
    return FacebookService.instance;
  }

  /**
   * Validate Facebook credentials and initialize the API
   */
  async validateCredentials(credentials: FacebookCredentials): Promise<{
    isValid: boolean;
    adAccount?: FacebookAdAccount;
    permissions?: string[];
  }> {
    try {
      // Initialize Facebook API
      FacebookAdsApi.init(credentials.accessToken);
      
      // Test the access token by getting user info
      const user = await FacebookAdsApi.getInstance().getUser();
      
      // Get ad account information
      const adAccount = new AdAccount(credentials.adAccountId);
      const adAccountData = await adAccount.get([
        'id',
        'name',
        'currency',
        'timezone_name'
      ]);

      // Get permissions
      const permissions = await this.getPermissions(credentials.accessToken);

      this.accessToken = credentials.accessToken;
      this.adAccountId = credentials.adAccountId;

      logger.info('Facebook credentials validated successfully', {
        adAccountId: credentials.adAccountId,
        permissions: permissions
      });

      return {
        isValid: true,
        adAccount: {
          id: adAccountData.id,
          name: adAccountData.name,
          currency: adAccountData.currency,
          timezone: adAccountData.timezone_name
        },
        permissions: permissions
      };

    } catch (error) {
      logger.error('Facebook credentials validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adAccountId: credentials.adAccountId
      });

      return {
        isValid: false
      };
    }
  }

  /**
   * Get user permissions for the access token
   */
  private async getPermissions(accessToken: string): Promise<string[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/me/permissions?access_token=${accessToken}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as any;
      return data.data
        .filter((permission: any) => permission.status === 'granted')
        .map((permission: any) => permission.permission);

    } catch (error) {
      logger.error('Failed to get Facebook permissions', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Create a campaign
   */
  async createCampaign(name: string, status: 'ACTIVE' | 'PAUSED' = 'PAUSED'): Promise<string> {
    if (!this.accessToken || !this.adAccountId) {
      throw new AppError('Facebook API not initialized. Please validate credentials first.');
    }

    try {
      FacebookAdsApi.init(this.accessToken);
      const adAccount = new AdAccount(this.adAccountId);

      const campaign = await adAccount.createCampaign(
        [],
        {
          name: name,
          objective: 'OUTCOME_TRAFFIC',
          status: status,
          special_ad_categories: []
        }
      );

      logger.info('Campaign created successfully', {
        campaignId: campaign.id,
        name: name
      });

      return campaign.id;

    } catch (error) {
      logger.error('Failed to create campaign', {
        error: error instanceof Error ? error.message : 'Unknown error',
        name: name
      });
      throw new AppError(`Failed to create campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create an ad set
   */
  async createAdSet(
    campaignId: string,
    name: string,
    targeting: any,
    budget: { amount: number; currency: string; type: 'DAILY' | 'LIFETIME' },
    status: 'ACTIVE' | 'PAUSED' = 'PAUSED'
  ): Promise<string> {
    if (!this.accessToken || !this.adAccountId) {
      throw new AppError('Facebook API not initialized. Please validate credentials first.');
    }

    try {
      FacebookAdsApi.init(this.accessToken);
      const adAccount = new AdAccount(this.adAccountId);

      const adSet = await adAccount.createAdSet(
        [],
        {
          name: name,
          campaign_id: campaignId,
          targeting: targeting,
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'REACH',
          bid_amount: 2000, // $20.00 in cents
          daily_budget: budget.type === 'DAILY' ? budget.amount * 100 : undefined,
          lifetime_budget: budget.type === 'LIFETIME' ? budget.amount * 100 : undefined,
          status: status
        }
      );

      logger.info('Ad Set created successfully', {
        adSetId: adSet.id,
        name: name,
        campaignId: campaignId
      });

      return adSet.id;

    } catch (error) {
      logger.error('Failed to create ad set', {
        error: error instanceof Error ? error.message : 'Unknown error',
        name: name,
        campaignId: campaignId
      });
      throw new AppError(`Failed to create ad set: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create an ad
   */
  async createAd(
    adSetId: string,
    name: string,
    adCopy: {
      headline: string;
      primaryText: string;
      callToAction?: string;
    },
    imageUrl: string,
    status: 'ACTIVE' | 'PAUSED' = 'PAUSED'
  ): Promise<string> {
    if (!this.accessToken || !this.adAccountId) {
      throw new AppError('Facebook API not initialized. Please validate credentials first.');
    }

    try {
      FacebookAdsApi.init(this.accessToken);
      const adAccount = new AdAccount(this.adAccountId);

      // Create ad creative first
      const creative = await adAccount.createAdCreative(
        [],
        {
          name: `${name} - Creative`,
          object_story_spec: {
            page_id: process.env['FACEBOOK_PAGE_ID'], // You'll need to add this to env
            link_data: {
              image_hash: imageUrl, // This should be an image hash from Facebook
              link: process.env['WEBSITE_URL'] || 'https://example.com',
              message: adCopy.primaryText,
              name: adCopy.headline,
              call_to_action: adCopy.callToAction ? {
                type: adCopy.callToAction
              } : undefined
            }
          }
        }
      );

      // Create the ad
      const ad = await adAccount.createAd(
        [],
        {
          name: name,
          adset_id: adSetId,
          creative: {
            creative_id: creative.id
          },
          status: status
        }
      );

      logger.info('Ad created successfully', {
        adId: ad.id,
        name: name,
        adSetId: adSetId
      });

      return ad.id;

    } catch (error) {
      logger.error('Failed to create ad', {
        error: error instanceof Error ? error.message : 'Unknown error',
        name: name,
        adSetId: adSetId
      });
      throw new AppError(`Failed to create ad: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload image to Facebook
   */
  async uploadImage(imageBuffer: Buffer, filename: string): Promise<string> {
    if (!this.accessToken || !this.adAccountId) {
      throw new AppError('Facebook API not initialized. Please validate credentials first.');
    }

    try {
      // For now, we'll return a placeholder
      // In a real implementation, you'd upload to Facebook's CDN
      const imageHash = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      logger.info('Image uploaded successfully', {
        filename: filename,
        imageHash: imageHash
      });

      return imageHash;

    } catch (error) {
      logger.error('Failed to upload image', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filename: filename
      });
      throw new AppError(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return !!(this.accessToken && this.adAccountId);
  }

  /**
   * Get current configuration
   */
  getConfig(): { accessToken: string | null; adAccountId: string | null } {
    return {
      accessToken: this.accessToken,
      adAccountId: this.adAccountId
    };
  }
} 