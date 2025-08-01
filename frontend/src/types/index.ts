import { UploadedMedia, AdCopy, Placement } from '../lib/api';

// Individual Ad Item Interface
export interface BulkAdItem {
  id: string;
  mediaId: string;
  mediaType: 'image' | 'video';
  filename: string;
  thumbnailUrl: string;
  facebookMediaHash?: string; // Facebook media hash for creatives
  facebookMediaId?: string; // Facebook media ID
  campaignId: string;
  campaignName: string;
  adSetName: string;
  adName: string;
  budget: number;
  startDate: Date | null;
  facebookPageId: string;
  instagramPageId: string;
  landingPageUrl: string; // NEW: Landing page URL for ads
  mediaSetup: MediaSetupOption;
  advantagePlusEnhancements: AdvantagePlusEnhancements;
  pixelId: string;
  urlParams: string;
  bidStrategy: 'LOWEST_COST_WITHOUT_CAP' | 'LOWEST_COST_WITH_BID_CAP' | 'COST_CAP' | 'BID_CAP' | 'ABSOLUTE_OCPM' | 'LOWEST_COST_WITH_MIN_ROAS';
  bidAmount?: number;
  bidConstraints?: {
    roasAverageFloor?: number; // For LOWEST_COST_WITH_MIN_ROAS (scaled up 10000x)
  };
}

// Facebook Campaign Interface
export interface FacebookCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  adAccountId: string;
}

// Facebook Page Interface
export interface FacebookPage {
  id: string;
  name: string;
  category: string;
  accessToken: string;
  type: 'facebook' | 'instagram' | 'both';
}

export interface MediaSetupOption {
  type: 'manual' | 'advantage_plus_catalog';
  label: string;
  description: string;
}

export interface AdvantagePlusEnhancements {
  translateText: boolean;
  showProducts: boolean;
  visualTouchUps: boolean;
  textImprovements: boolean;
  enhanceCTA: boolean;
  addVideoEffects: boolean;
}

// Enhanced Bulk Ads Request
export interface EnhancedBulkAdRequest {
  items: BulkAdItem[];
  templateId: string;
  campaignId?: string; // For using existing campaign
  options: {
    createCampaign: boolean;
    createAdSet: boolean;
    status: 'ACTIVE' | 'PAUSED';
  };
}

// Mass Apply Options
export interface MassApplyOptions {
  campaignId?: string;
  budget?: number;
  startDate?: Date | null;
  facebookPageId?: string;
  instagramPageId?: string;
  landingPageUrl?: string; // NEW: Landing page URL for mass apply
  mediaSetup?: MediaSetupOption;
  advantagePlusEnhancements?: AdvantagePlusEnhancements;
  pixelId?: string;
  urlParams?: string;
}

// Facebook Pixel/Dataset for Tracking
export interface FacebookPixel {
  id: string;
  name: string;
  datasetId: string;
  status: 'ACTIVE' | 'INACTIVE';
  type: 'CONVERSIONS_API' | 'PIXEL' | string;
}

// Facebook Ads Template Enhancement Types

// Conversion Location Types
export type ConversionLocation = 
  | 'WEBSITE'
  | 'APP'
  | 'WEBSITE_AND_APP'
  | 'MESSAGE_DESTINATIONS'
  | 'CALLS'
  | 'WEBSITE_AND_IN_STORE'
  | 'WEBSITE_AND_CALLS';

// Conversion Goal Types
export type ConversionGoal = 
  | 'MAXIMIZE_CONVERSIONS'
  | 'MAXIMIZE_CONVERSION_VALUE'
  | 'MAXIMIZE_LANDING_PAGE_VIEWS'
  | 'MAXIMIZE_LINK_CLICKS';

// Facebook Dataset Interface
export interface FacebookDataset {
  id: string;
  name: string;
  datasetId: string;
  type: 'CONVERSIONS_API' | 'PIXEL';
  isActive: boolean;
}

// Conversion Event Interface
export interface ConversionEvent {
  id: string;
  name: string;
  description?: string;
  hasConversionsApi: boolean;
  isCustom: boolean;
}

// Cost Per Result Goal Interface
export interface CostPerResultGoal {
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD';
}

// Delivery Type
export type DeliveryType = 'STANDARD' | 'ACCELERATED';

// Attribution Windows Interface
export interface AttributionWindows {
  clickThrough: 1 | 7;
  viewThrough: 1;
}

// Enhanced Targeting Interface
export interface EnhancedTargeting {
  locations: {
    inclusion: string[];
    exclusion: string[];
  };
  ageMin: number;
  ageMax?: number;
  customAudienceExclusion: string[];
  languages: string[];
  interests: string[];
  behaviors: string[];
  demographics: {
    educationStatuses: number[];
    relationshipStatuses: number[];
    income: string[];
    lifeEvents: string[];
    selectedDemographics: Array<{ id: string; name: string; category: string; type: string }>;
  };
  exclusions: {
    interests: string[];
    behaviors: string[];
    demographics: {
      educationStatuses: number[];
      relationshipStatuses: number[];
    };
  };
  devicePlatforms: ('desktop' | 'mobile' | 'connected_tv')[];
}

// Placement Controls Interface
export interface PlacementControls {
  feeds: boolean;
  storiesAndReels: boolean;
  inStreamAds: boolean;
  searchResults: boolean;
  appsAndSites: boolean;
}

// Enhanced Ad Template Interface
export interface EnhancedAdTemplate {
  id: string;
  name: string;
  adDescription: string;
  adCopy: AdCopy;
  targeting: EnhancedTargeting;
  delivery: DeliverySettings;
  conversion: ConversionSettings;
  placement: Placement;
  specialAdCategories: string[]; // NEW FIELD
  optimizationGoal: 'LINK_CLICKS' | 'CONVERSIONS' | 'REACH' | 'BRAND_AWARENESS' | 'VIDEO_VIEWS' | 'OUTCOME_TRAFFIC' | 'OUTCOME_ENGAGEMENT' | 'OUTCOME_LEADS' | 'OUTCOME_SALES' | 'OUTCOME_APP_PROMOTION'; // NEW FIELD
  billingEvent: 'IMPRESSIONS' | 'LINK_CLICKS'; // NEW FIELD
  createdAt: string;
  updatedAt: string;
}

// Create Enhanced Template Request Interface
export interface CreateEnhancedTemplateRequest {
  name: string;
  adDescription: string;
  adCopy: AdCopy;
  targeting: EnhancedTargeting;
  delivery: DeliverySettings;
  conversion: ConversionSettings;
  placement: Placement;
  specialAdCategories: string[]; // NEW FIELD
  optimizationGoal: 'LINK_CLICKS' | 'CONVERSIONS' | 'REACH' | 'BRAND_AWARENESS' | 'VIDEO_VIEWS'; // NEW FIELD
  billingEvent: 'IMPRESSIONS' | 'LINK_CLICKS'; // NEW FIELD
}

// Facebook Location Interface
export interface FacebookLocation {
  id: string;
  name: string;
  type: 'country' | 'region' | 'city';
  country_code?: string;
}

// Facebook Conversion Event Interface
export interface FacebookConversionEvent {
  id: string;
  name: string;
  category: string;
  description?: string;
}

// Delivery Settings Interface
export interface DeliverySettings {
  accelerated: boolean;
  costPerResult?: number;
  costPerResultCurrency?: 'USD' | 'EUR' | 'GBP' | 'CAD';
}

// Conversion Settings Interface
export interface ConversionSettings {
  conversionEvent: FacebookConversionEvent | null;
  dataset: FacebookDataset | null;
} 

export interface AdTemplate {
  id: string;
  name: string;
  adDescription: string;
  adCopy: AdCopy;
  targeting: EnhancedTargeting;
  delivery: DeliverySettings;
  conversion: ConversionSettings;
  placement: Placement;
  specialAdCategories: string[];
  optimizationGoal: 'LINK_CLICKS' | 'CONVERSIONS' | 'REACH' | 'BRAND_AWARENESS' | 'VIDEO_VIEWS';
  billingEvent: 'IMPRESSIONS' | 'LINK_CLICKS';
  createdAt: string;
  updatedAt: string;
} 