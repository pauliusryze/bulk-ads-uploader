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
      objective: 'OUTCOME_TRAFFIC', // Default objective, can be made configurable
      status: 'PAUSED', // Always create in paused status for safety
      special_ad_categories: template.specialAdCategories || [], // Required by Facebook API
    };
  }

  // Map template to Facebook ad set data
  private mapTemplateToAdSet(
    template: EnhancedAdTemplate,
    campaignId: string,
    adSetName: string,
    budget: number,
    bidStrategy?: 'LOWEST_COST_WITHOUT_CAP' | 'LOWEST_COST_WITH_BID_CAP' | 'COST_CAP' | 'BID_CAP' | 'ABSOLUTE_OCPM',
    bidAmount?: number
  ): FacebookAdSetData {
    // Convert locations to modern format (EnhancedTargeting uses string arrays)
    const geoLocations = template.targeting.locations?.inclusion?.length > 0 ? {
      countries: template.targeting.locations.inclusion.map(countryCode => ({
        key: countryCode,
        name: countryCode // In a real app, you'd have a mapping of country codes to names
      }))
    } : undefined;

    // Convert custom audience exclusions to modern format
    const excludedCustomAudiences = template.targeting.customAudienceExclusion?.length > 0 ? 
      template.targeting.customAudienceExclusion.map(audienceId => ({ id: audienceId })) : undefined;

    // Build targeting object with only defined values
    const targeting: any = {
      // Basic demographics - these are required
      age_min: template.targeting.ageMin || 18,
      age_max: template.targeting.ageMax || 65,
    };

    // Only add geo_locations if we have valid data
    if (geoLocations) {
      targeting.geo_locations = geoLocations;
    }

    // Only add excluded_custom_audiences if we have valid data
    if (excludedCustomAudiences) {
      targeting.excluded_custom_audiences = excludedCustomAudiences;
    }

    // Only add interests if we have valid data
    if (template.targeting.interests?.length > 0) {
      targeting.interests = template.targeting.interests.map(interestId => ({ 
        id: interestId, 
        name: interestId 
      }));
    }

    // Only add behaviors if we have valid data
    if (template.targeting.behaviors?.length > 0) {
      targeting.behaviors = template.targeting.behaviors.map(behaviorId => ({ 
        id: behaviorId, 
        name: behaviorId 
      }));
    }

    // Only add demographics if we have valid data
    if (template.targeting.demographics) {
      const demographics: any = {};
      
      if (template.targeting.demographics.educationStatuses?.length > 0) {
        demographics.education_statuses = template.targeting.demographics.educationStatuses;
      }
      
      if (template.targeting.demographics.relationshipStatuses?.length > 0) {
        demographics.relationship_statuses = template.targeting.demographics.relationshipStatuses;
      }
      
      if (template.targeting.demographics.income?.length > 0) {
        demographics.income = template.targeting.demographics.income.map(incomeId => ({ 
          id: incomeId, 
          name: incomeId 
        }));
      }
      
      if (template.targeting.demographics.lifeEvents?.length > 0) {
        demographics.life_events = template.targeting.demographics.lifeEvents.map(eventId => ({ 
          id: eventId, 
          name: eventId 
        }));
      }
      
      if (Object.keys(demographics).length > 0) {
        targeting.demographics = demographics;
      }
    }

    // Only add exclusions if we have valid data
    if (template.targeting.exclusions) {
      const exclusions: any = {};
      
      if (template.targeting.exclusions.interests?.length > 0) {
        exclusions.interests = template.targeting.exclusions.interests.map(interestId => ({ 
          id: interestId, 
          name: interestId 
        }));
      }
      
      if (template.targeting.exclusions.behaviors?.length > 0) {
        exclusions.behaviors = template.targeting.exclusions.behaviors.map(behaviorId => ({ 
          id: behaviorId, 
          name: behaviorId 
        }));
      }
      
      if (template.targeting.exclusions.demographics) {
        const exclusionDemographics: any = {};
        
        if (template.targeting.exclusions.demographics.educationStatuses?.length > 0) {
          exclusionDemographics.education_statuses = template.targeting.exclusions.demographics.educationStatuses;
        }
        
        if (template.targeting.exclusions.demographics.relationshipStatuses?.length > 0) {
          exclusionDemographics.relationship_statuses = template.targeting.exclusions.demographics.relationshipStatuses;
        }
        
        if (Object.keys(exclusionDemographics).length > 0) {
          exclusions.demographics = exclusionDemographics;
        }
      }
      
      if (Object.keys(exclusions).length > 0) {
        targeting.exclusions = exclusions;
      }
    }

    // Only add device_platforms if we have valid data
    if (template.targeting.devicePlatforms?.length > 0) {
      // Convert to Facebook's expected format
      const devicePlatforms = template.targeting.devicePlatforms.map(platform => {
        switch (platform) {
          case 'desktop': return 'desktop';
          case 'mobile': return 'mobile';
          case 'connected_tv': return 'connected_tv';
          default: return 'desktop';
        }
      });
      targeting.device_platforms = devicePlatforms;
    }

    // Only add locales if we have valid data
    if (template.targeting.languages?.length > 0) {
      targeting.locales = template.targeting.languages.map(lang => {
        // Convert language codes to Facebook locale IDs
        const localeMap: { [key: string]: number } = {
          'en': 1033, // English (US)
          'es': 1034, // Spanish
          'fr': 1036, // French
          'de': 1031, // German
          'it': 1040, // Italian
          'pt': 1046, // Portuguese
          'ja': 1041, // Japanese
          'ko': 1042, // Korean
          'zh': 1028, // Chinese (Traditional)
          'ar': 1025, // Arabic
        };
        return localeMap[lang] || 1033; // Default to English
      });
    }

    // Only add publisher_platforms if we have valid data
    if (template.placement.facebook || template.placement.instagram) {
      const platforms = [];
      if (template.placement.facebook) platforms.push('facebook');
      if (template.placement.instagram) platforms.push('instagram');
      if (platforms.length > 0) {
        targeting.publisher_platforms = platforms;
      }
    }

    // Add geo_locations with a default country if none specified
    if (!geoLocations) {
      targeting.geo_locations = {
        countries: ['US']
      };
    } else {
      targeting.geo_locations = geoLocations;
    }

    return {
      name: adSetName,
      campaign_id: campaignId,
      daily_budget: Math.max(budget * 100, 100), // Convert to cents, minimum 100 cents ($1.00)
      billing_event: template.billingEvent || 'IMPRESSIONS',
      optimization_goal: template.optimizationGoal || 'LINK_CLICKS',
      bid_strategy: bidStrategy || 'LOWEST_COST_WITHOUT_CAP',
      bid_amount: bidAmount ? bidAmount * 100 : undefined, // Convert to cents
      targeting,
      status: 'PAUSED', // Always create in paused status for safety
      special_ad_categories: template.specialAdCategories || [],
    };
  }

  // Validate template and ad items before creating ads
  private validateBulkAdsData(
    template: EnhancedAdTemplate,
    adItems: BulkAdItem[],
    pageId: string
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate template required fields
    if (!template.adCopy.primaryText?.trim()) {
      errors.push('Template primary text is required for all ads');
    }
    if (!template.adCopy.headline?.trim()) {
      errors.push('Template headline is required for all ads');
    }
    if (!template.adCopy.callToAction?.trim()) {
      errors.push('Template call to action is required for all ads');
    }

    // Validate each ad item
    adItems.forEach((adItem, index) => {
      const adNumber = index + 1;
      
      // Validate media requirements
      if (adItem.mediaType === 'video') {
        if (!adItem.facebookMediaId?.trim()) {
          errors.push(`Ad ${adNumber} (${adItem.filename}): Video ID is required for video ads`);
        }
      } else if (adItem.mediaType === 'image') {
        if (!adItem.facebookMediaHash?.trim()) {
          errors.push(`Ad ${adNumber} (${adItem.filename}): Image hash is required for image ads`);
        }
      }

      // Validate ad-specific required fields
      if (!adItem.adName?.trim()) {
        errors.push(`Ad ${adNumber} (${adItem.filename}): Ad name is required`);
      }
      if (!adItem.adSetName?.trim()) {
        errors.push(`Ad ${adNumber} (${adItem.filename}): Ad set name is required`);
      }
      if (!adItem.budget || adItem.budget <= 0) {
        errors.push(`Ad ${adNumber} (${adItem.filename}): Valid budget is required`);
      }
      if (!adItem.landingPageUrl?.trim()) {
        errors.push(`Ad ${adNumber} (${adItem.filename}): Landing page URL is required`);
      }
      if (!adItem.landingPageUrl?.startsWith('http')) {
        errors.push(`Ad ${adNumber} (${adItem.filename}): Landing page URL must be a valid URL starting with http/https`);
      }
    });

    // Validate page ID
    if (!pageId?.trim()) {
      errors.push('Facebook page ID is required for ad creatives');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Map template and ad item to Facebook creative data
  private mapTemplateToCreative(
    template: EnhancedAdTemplate,
    adItem: BulkAdItem,
    pageId: string
  ): FacebookCreativeData {
    // Check if we have uploaded media
    if (adItem.facebookMediaHash || adItem.facebookMediaId) {
      // Create media-based creative
      if (adItem.mediaType === 'video') {
        const videoId = adItem.facebookMediaId;
        if (!videoId) {
          throw new Error(`No video ID found for ${adItem.filename}`);
        }
        
        console.log('🔍 Video creative creation details:', {
          filename: adItem.filename,
          videoId: videoId,
          pageId: pageId,
          primaryText: template.adCopy.primaryText,
          headline: template.adCopy.headline,
          callToAction: template.adCopy.callToAction,
          landingPageUrl: adItem.landingPageUrl
        });
        
        // VALIDATE VIDEO PARAMETERS BEFORE CREATING CREATIVE
        console.log('🔍 VALIDATING VIDEO PARAMETERS:');
        console.log('🔍 Video ID type:', typeof videoId, 'Value:', videoId);
        console.log('🔍 Page ID type:', typeof pageId, 'Value:', pageId);
        console.log('🔍 Primary text type:', typeof template.adCopy.primaryText, 'Value:', template.adCopy.primaryText);
        console.log('🔍 Landing page URL type:', typeof adItem.landingPageUrl, 'Value:', adItem.landingPageUrl);
        
        // Check for empty or invalid values
        if (!videoId || videoId.trim() === '') {
          throw new Error(`Invalid video ID: "${videoId}" for ${adItem.filename}`);
        }
        if (!pageId || pageId.trim() === '') {
          throw new Error(`Invalid page ID: "${pageId}"`);
        }
        if (!template.adCopy.primaryText || template.adCopy.primaryText.trim() === '') {
          throw new Error(`Invalid primary text: "${template.adCopy.primaryText}"`);
        }
        if (!adItem.landingPageUrl || adItem.landingPageUrl.trim() === '') {
          throw new Error(`Invalid landing page URL: "${adItem.landingPageUrl}"`);
        }
        
        // For video creatives, use video_data (correct Facebook API format)
        const videoCreative = {
          name: `${adItem.adName} Creative`,
          object_story_spec: {
            page_id: pageId,
            video_data: {
              video_id: videoId,
              message: template.adCopy.primaryText || 'Primary Text',
              // Facebook requires either image_hash or image_url for video thumbnail
              image_url: adItem.thumbnailUrl || 'https://via.placeholder.com/1200x630/1877f2/ffffff?text=Video+Thumbnail',
              call_to_action: {
                type: template.adCopy.callToAction || 'LEARN_MORE',
                value: {
                  link: adItem.landingPageUrl || 'https://your-website.com',
                },
              },
            },
          },
        };
        
        console.log('🔍 Creating video creative with data:', JSON.stringify(videoCreative, null, 2));
        
        return videoCreative;
      } else {
        // Create image-based creative
        return {
          name: `${adItem.adName} Creative`,
          object_story_spec: {
            page_id: pageId,
            link_data: {
              image_hash: adItem.facebookMediaHash,
              message: template.adCopy.primaryText || 'Primary Text',
              link: adItem.landingPageUrl || 'https://your-website.com',
              name: template.adCopy.headline || 'Ad Headline',
              call_to_action: {
                type: template.adCopy.callToAction || 'LEARN_MORE',
                value: {
                  link: adItem.landingPageUrl || 'https://your-website.com',
                },
              },
            },
          },
        };
      }
    } else {
      // Fallback to link-based creative if no media
      const linkData = {
        message: template.adCopy.primaryText || 'Primary Text',
        link: adItem.landingPageUrl || 'https://your-website.com',
        call_to_action: {
          type: template.adCopy.callToAction || 'LEARN_MORE',
          value: {
            link: adItem.landingPageUrl || 'https://your-website.com',
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
    onProgress?: (progress: number, message: string) => void,
    existingCampaignId?: string
  ): Promise<BulkAdCreationResult> {
    const result: BulkAdCreationResult = {
      campaignId: '',
      adSetIds: [],
      creativeIds: [],
      adIds: [],
      errors: [],
      previewUrls: [],
    };

    // Validate all data before proceeding
    onProgress?.(5, 'Validating ad data...');
    const validation = this.validateBulkAdsData(template, adItems, pageId);
    
    if (!validation.isValid) {
      result.errors = validation.errors;
      onProgress?.(100, 'Validation failed - please fix the errors');
      return result;
    }

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
      // 1. Use existing campaign or create new one
      console.log('🏭 CAMPAIGN HANDLING DEBUG:');
      console.log('🏭 existingCampaignId:', existingCampaignId);
      console.log('🏭 Should use existing campaign:', !!existingCampaignId);
      
      if (existingCampaignId) {
        onProgress?.(10, 'Using existing campaign...');
        result.campaignId = existingCampaignId;
        console.log('✅ Using existing campaign ID:', existingCampaignId);
        onProgress?.(20, 'Using existing campaign');
      } else {
        onProgress?.(10, 'Creating campaign...');
        console.log('🆕 Creating new campaign because existingCampaignId is not provided');
        const campaignData = this.mapTemplateToCampaign(template);
        const campaignResult = await this.apiClient.createCampaign(adAccountId, campaignData);
        result.campaignId = campaignResult.id;
        onProgress?.(20, 'Campaign created successfully');
      }

      // 2. Create ad sets and ads for each ad item
      const totalSteps = adItems.length * 3; // ad set + creative + ad for each item
      let completedSteps = 0;

      for (let i = 0; i < adItems.length; i++) {
        const adItem = adItems[i];
        
        try {
          onProgress?.(20 + (completedSteps / totalSteps) * 60, `Creating ad ${i + 1}/${adItems.length}...`);
          
          // Create ad set
          let adSetResult: { id: string };
          try {
            const adSetData = this.mapTemplateToAdSet(
              template,
              result.campaignId,
              adItem.adSetName,
              budget,
              adItem.bidStrategy,
              adItem.bidAmount
            );
            
            // Debug: Log the ad set data being sent to Facebook
            console.log('🔍 Creating ad set with data:', JSON.stringify(adSetData, null, 2));
            
            adSetResult = await this.apiClient.createAdSet(adAccountId, adSetData);
            result.adSetIds.push(adSetResult.id);
            completedSteps++;
          } catch (error) {
            throw new Error(`Failed to create ad set for ${adItem.adName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }

          onProgress?.(20 + (completedSteps / totalSteps) * 60, `Creating creative for ad ${i + 1}...`);
          
          // For videos, wait for processing to complete before creating creative
          if (adItem.mediaType === 'video' && adItem.facebookMediaId) {
            onProgress?.(20 + (completedSteps / totalSteps) * 60, `Waiting for video processing for ad ${i + 1}...`);
            console.log('🔍 Waiting for video to be ready:', adItem.facebookMediaId);
            
            // TEMPORARILY SKIP VIDEO PROCESSING WAIT FOR TESTING
            console.log('🧪 SKIPPING video processing wait for testing...');
            /*
            const isVideoReady = await this.apiClient.waitForVideoReady(adItem.facebookMediaId, 60000); // 1 minute timeout
            if (!isVideoReady) {
              throw new Error(`Video processing failed or timed out for ${adItem.filename}`);
            }
            */
          }
          
          // Create creative
          let creativeResult: { id: string };
          let creativeData: FacebookCreativeData;
          try {
            creativeData = this.mapTemplateToCreative(template, adItem, pageId);
            
            // Check if we're using a sandbox account
            if (adAccountId.includes('sandbox') || adAccountId.includes('test')) {
              console.warn('⚠️ ATTEMPTING TO CREATE CREATIVE IN SANDBOX ACCOUNT');
              console.warn('⚠️ This will likely fail due to sandbox limitations');
              console.warn('⚠️ Sandbox accounts cannot create real ad creatives');
            }
            
            // Debug: Log the creative data being sent to Facebook
            console.log('🔍 Creating creative with data:', JSON.stringify(creativeData, null, 2));
            
            creativeResult = await this.apiClient.createAdCreative(adAccountId, creativeData);
            result.creativeIds.push(creativeResult.id);
            completedSteps++;
          } catch (error) {
            throw new Error(`Failed to create creative for ${adItem.adName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }

          onProgress?.(20 + (completedSteps / totalSteps) * 60, `Creating ad ${i + 1}...`);
          
          // Create ad
          try {
            const adData = this.mapAdItemToAd(adItem, adSetResult.id, creativeResult.id);
            const adResult = await this.apiClient.createAd(adAccountId, adData);
            result.adIds.push(adResult.id);
            completedSteps++;
          } catch (error) {
            throw new Error(`Failed to create ad for ${adItem.adName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }

          onProgress?.(20 + (completedSteps / totalSteps) * 60, `Generating preview for ad ${i + 1}...`);
          
          // Generate preview
          const previewUrl = await this.generateAdPreview(adAccountId, creativeData, 'DESKTOP_FEED_STANDARD');
          result.previewUrls.push(previewUrl);

        } catch (error) {
          const errorMessage = `Failed to create ad ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMessage);
          console.error(errorMessage, error);
          
          // Add more specific error context
          console.error('🔍 Failed ad item details:', {
            adName: adItem.adName,
            mediaType: adItem.mediaType,
            videoId: adItem.facebookMediaId,
            pageId: pageId,
            campaignId: result.campaignId
          });
        }
      }

      onProgress?.(90, 'Finalizing...');

      // 3. Validate results
      if (result.adIds.length === 0) {
        throw new Error('No ads were created successfully');
      }

      onProgress?.(100, 'Bulk ad creation completed!');

    } catch (error) {
      const errorMessage = `Failed to create bulk ads: ${error instanceof Error ? error.message : 'Unknown error'}`;
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

  // Extract video thumbnail from video file
  private async extractVideoThumbnail(videoFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      video.onloadedmetadata = () => {
        // Set canvas dimensions to video dimensions (or max 1200x630 for Facebook)
        const maxWidth = 1200;
        const maxHeight = 630;
        let { videoWidth, videoHeight } = video;
        
        // Calculate aspect ratio and resize if needed
        const aspectRatio = videoWidth / videoHeight;
        if (videoWidth > maxWidth) {
          videoWidth = maxWidth;
          videoHeight = maxWidth / aspectRatio;
        }
        if (videoHeight > maxHeight) {
          videoHeight = maxHeight;
          videoWidth = maxHeight * aspectRatio;
        }
        
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        // Seek to a random frame (between 10% and 90% of video duration)
        const randomTime = video.duration * (0.1 + Math.random() * 0.8);
        video.currentTime = randomTime;
      };
      
      video.onseeked = () => {
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailDataUrl);
        
        // Clean up
        video.remove();
        canvas.remove();
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video for thumbnail extraction'));
      };
      
      // Set video source and load
      video.src = URL.createObjectURL(videoFile);
      video.load();
    });
  }
} 