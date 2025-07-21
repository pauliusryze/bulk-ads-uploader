import { UploadedMedia, AdCopy, Placement } from '../lib/api';

// Individual Ad Item Interface
export interface BulkAdItem {
  id: string;
  mediaId: string;
  mediaType: 'image' | 'video';
  filename: string;
  thumbnailUrl: string;
  campaignId: string;
  campaignName: string;
  adSetName: string;
  adName: string;
  budget: number;
  startDate: Date | null;
  facebookPageId: string;
  instagramPageId: string;
  mediaSetup: MediaSetupOption;
  advantagePlusEnhancements: AdvantagePlusEnhancements;
  pixelId: string;
  urlParams: string;
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