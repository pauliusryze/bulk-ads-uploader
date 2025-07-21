import FacebookAPIClient, {
  FacebookCampaignData,
  FacebookAdSetData,
  FacebookCreativeData,
  FacebookAdData,
} from '../lib/facebook-api';
import { EnhancedAdTemplate, BulkAdItem } from '../types';

export interface BulkAdCreationResult {
  campaignId: string;
  adSetIds: string[];
  creativeIds: string[];
  adIds: string[];
  errors: string[];
  previewUrls: string[];
}

export interface AdPreviewData {
  adId: string;
  previewUrl: string;
  adFormat: string;
}

export class FacebookAdService {
  private apiClient: FacebookAPIClient;
  private isDevelopmentMode: boolean;

  constructor(apiClient: FacebookAPIClient) {
    this.apiClient = apiClient;
    this.isDevelopmentMode = process.env.NODE_ENV === 'development' && 
      (typeof window !== 'undefined' && window.location.protocol === 'http:');
  }

  // Map template to Facebook campaign data
  private mapTemplateToCampaign(template: EnhancedAdTemplate): FacebookCampaignData {
    return {
      name: template.name,
      objective: 'LINK_CLICKS', // Default objective, can be made configurable
      status: 'PAUSED', // Always create in paused status for safety
    };
  }

  // Map template to Facebook ad set data
  private mapTemplateToAdSet(
    template: EnhancedAdTemplate,
    campaignId: string,
    adSetName: string,
    budget: number
  ): FacebookAdSetData {
    return {
      name: adSetName,
      campaign_id: campaignId,
      daily_budget: budget * 100, // Convert to cents
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'LINK_CLICKS',
      targeting: {
        age_min: template.targeting.ageMin,
        age_max: template.targeting.ageMax,
        geo_locations: {
          countries: template.targeting.locations.inclusion || [],
        },
      },
      status: 'PAUSED', // Always create in paused status for safety
    };
  }

  // Map template and ad item to Facebook creative data
  private mapTemplateToCreative(
    template: EnhancedAdTemplate,
    adItem: BulkAdItem,
    pageId: string
  ): FacebookCreativeData {
    const linkData = {
      message: template.adCopy.primaryText,
      link: 'https://your-website.com', // This should be configurable
      call_to_action: {
        type: template.adCopy.callToAction || 'LEARN_MORE',
        value: {
          link: 'https://your-website.com',
        },
      },
    };

    return {
      name: `${adItem.adName} Creative`,
      object_story_spec: {
        page_id: pageId,
        link_data: linkData,
      },
    };
  }

  // Map ad item to Facebook ad data
  private mapAdItemToAd(
    adItem: BulkAdItem,
    adSetId: string,
    creativeId: string
  ): FacebookAdData {
    return {
      name: adItem.adName,
      adset_id: adSetId,
      creative: {
        creative_id: creativeId,
      },
      status: 'PAUSED', // Always create in paused status for safety
    };
  }

  // Upload media to Facebook
  async uploadMediaToFacebook(adAccountId: string, file: File): Promise<string> {
    if (this.isDevelopmentMode) {
      console.log('Development mode: Mock media upload for', file.name);
      return `mock_media_hash_${Date.now()}`;
    }
    
    const result = await this.apiClient.uploadMedia(adAccountId, file);
    return result.hash; // Return the media hash for use in creatives
  }

  // Generate ad preview
  async generateAdPreview(
    adAccountId: string,
    creativeSpec: any,
    adFormat: string = 'DESKTOP_FEED_STANDARD'
  ): Promise<string> {
    if (this.isDevelopmentMode) {
      console.log('Development mode: Mock ad preview generation');
      return `
        <div style="background: #f0f0f0; padding: 20px; border: 1px solid #ccc; border-radius: 8px; max-width: 400px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Mock Ad Preview</h3>
          <p style="margin: 0 0 15px 0; color: #666;">This is a mock preview of your ad. In production, this would show the actual Facebook ad preview.</p>
          <div style="background: white; padding: 15px; border-radius: 4px;">
            <strong style="color: #1877f2;">${creativeSpec.name || 'Ad Creative'}</strong>
            <p style="margin: 10px 0 0 0; color: #333;">Mock ad content would appear here...</p>
          </div>
        </div>
      `;
    }
    
    const result = await this.apiClient.generateAdPreview(adAccountId, creativeSpec, adFormat);
    return result.body; // Return the preview HTML
  }

  // Create bulk ads with preview
  async createBulkAdsWithPreview(
    template: EnhancedAdTemplate,
    adItems: BulkAdItem[],
    adAccountId: string,
    pageId: string,
    budget: number,
    onProgress?: (progress: number, message: string) => void
  ): Promise<BulkAdCreationResult> {
    const result: BulkAdCreationResult = {
      campaignId: '',
      adSetIds: [],
      creativeIds: [],
      adIds: [],
      errors: [],
      previewUrls: [],
    };

    // In development mode, use mock creation
    if (this.isDevelopmentMode) {
      console.log('Development mode: Mock bulk ad creation');
      
      onProgress?.(10, 'Creating campaign (mock)...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onProgress?.(20, 'Campaign created (mock)');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create mock ads
      for (let i = 0; i < adItems.length; i++) {
        onProgress?.(20 + (i / adItems.length) * 60, `Creating ad ${i + 1}/${adItems.length} (mock)...`);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        result.adSetIds.push(`mock_adset_${i + 1}`);
        result.creativeIds.push(`mock_creative_${i + 1}`);
        result.adIds.push(`mock_ad_${i + 1}`);
        
        // Generate mock preview
        const mockPreview = `
          <div style="background: #f0f0f0; padding: 20px; border: 1px solid #ccc; border-radius: 8px; max-width: 400px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Mock Ad Preview ${i + 1}</h3>
            <p style="margin: 0 0 15px 0; color: #666;">This is a mock preview of your ad. In production, this would show the actual Facebook ad preview.</p>
            <div style="background: white; padding: 15px; border-radius: 4px;">
              <strong style="color: #1877f2;">${adItems[i].adName}</strong>
              <p style="margin: 10px 0 0 0; color: #333;">Mock ad content would appear here...</p>
            </div>
          </div>
        `;
        result.previewUrls.push(mockPreview);
      }
      
      onProgress?.(90, 'Finalizing (mock)...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onProgress?.(100, 'Bulk ad creation completed (mock)!');
      return result;
    }

    try {
      onProgress?.(10, 'Creating campaign...');
      
      // 1. Create campaign
      const campaignData = this.mapTemplateToCampaign(template);
      const campaignResult = await this.apiClient.createCampaign(adAccountId, campaignData);
      result.campaignId = campaignResult.id;

      onProgress?.(20, 'Campaign created successfully');

      // 2. Create ad sets and ads for each ad item
      const totalSteps = adItems.length * 3; // ad set + creative + ad for each item
      let completedSteps = 0;

      for (let i = 0; i < adItems.length; i++) {
        const adItem = adItems[i];
        
        try {
          onProgress?.(20 + (completedSteps / totalSteps) * 60, `Creating ad ${i + 1}/${adItems.length}...`);
          
          // Create ad set
          const adSetData = this.mapTemplateToAdSet(
            template,
            result.campaignId,
            adItem.adSetName,
            budget
          );
          const adSetResult = await this.apiClient.createAdSet(adAccountId, adSetData);
          result.adSetIds.push(adSetResult.id);
          completedSteps++;

          onProgress?.(20 + (completedSteps / totalSteps) * 60, `Creating creative for ad ${i + 1}...`);
          
          // Create creative
          const creativeData = this.mapTemplateToCreative(template, adItem, pageId);
          const creativeResult = await this.apiClient.createAdCreative(adAccountId, creativeData);
          result.creativeIds.push(creativeResult.id);
          completedSteps++;

          onProgress?.(20 + (completedSteps / totalSteps) * 60, `Creating ad ${i + 1}...`);
          
          // Create ad
          const adData = this.mapAdItemToAd(adItem, adSetResult.id, creativeResult.id);
          const adResult = await this.apiClient.createAd(adAccountId, adData);
          result.adIds.push(adResult.id);
          completedSteps++;

          onProgress?.(20 + (completedSteps / totalSteps) * 60, `Generating preview for ad ${i + 1}...`);
          
          // Generate preview
          const previewUrl = await this.generateAdPreview(adAccountId, creativeData, 'DESKTOP_FEED_STANDARD');
          result.previewUrls.push(previewUrl);

        } catch (error) {
          const errorMessage = `Failed to create ad ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMessage);
          console.error(errorMessage, error);
        }
      }

      onProgress?.(90, 'Finalizing...');

      // 3. Validate results
      if (result.adIds.length === 0) {
        throw new Error('No ads were created successfully');
      }

      onProgress?.(100, 'Bulk ad creation completed!');

    } catch (error) {
      const errorMessage = `Failed to create campaign: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMessage);
      console.error(errorMessage, error);
    }

    return result;
  }

  // Get ad previews for existing ads
  async getAdPreviews(adIds: string[]): Promise<AdPreviewData[]> {
    const previews: AdPreviewData[] = [];

    for (const adId of adIds) {
      try {
        const result = await this.apiClient.getAdPreview(adId);
        if (result.data && result.data.length > 0) {
          previews.push({
            adId,
            previewUrl: result.data[0].body,
            adFormat: 'DESKTOP_FEED_STANDARD',
          });
        }
      } catch (error) {
        console.error(`Failed to get preview for ad ${adId}:`, error);
      }
    }

    return previews;
  }

  // Activate ads (change status from PAUSED to ACTIVE)
  async activateAds(adIds: string[]): Promise<void> {
    for (const adId of adIds) {
      try {
        await this.apiClient.updateAdStatus(adId, 'ACTIVE');
      } catch (error) {
        console.error(`Failed to activate ad ${adId}:`, error);
      }
    }
  }

  // Delete ads (for cleanup)
  async deleteAds(adIds: string[]): Promise<void> {
    for (const adId of adIds) {
      try {
        await this.apiClient.deleteAd(adId);
      } catch (error) {
        console.error(`Failed to delete ad ${adId}:`, error);
      }
    }
  }
} 