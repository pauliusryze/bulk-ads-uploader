export interface FacebookCredentials {
    appId: string;
    appSecret: string;
    accessToken: string;
    adAccountId: string;
}
export interface FacebookAdAccount {
    id: string;
    name: string;
    currency: string;
    timezone: string;
}
export interface FacebookPermissions {
    permissions: string[];
}
export interface UploadedImage {
    id: string;
    filename: string;
    originalName: string;
    url: string;
    size: number;
    mimeType: string;
    dimensions: {
        width: number;
        height: number;
    };
    uploadedAt: Date;
}
export interface UploadedMedia {
    id: string;
    filename: string;
    originalName: string;
    url: string;
    size: number;
    mimeType: string;
    mediaType: 'image' | 'video';
    dimensions: {
        width: number;
        height: number;
    };
    duration?: number;
    uploadedAt: string;
}
export interface UploadResponse {
    uploadedMedia: UploadedMedia[];
    totalUploaded: number;
    failedUploads: string[];
}
export interface AdCopy {
    headline: string;
    primaryText: string;
    callToAction?: 'SHOP_NOW' | 'LEARN_MORE' | 'SIGN_UP' | 'BOOK_NOW' | 'CONTACT_US';
    description?: string;
}
export interface Targeting {
    ageMin?: number;
    ageMax?: number;
    locations?: {
        inclusion?: string[];
        exclusion?: string[];
    };
    interests?: string[];
    customAudienceExclusion?: string[];
    languages?: string[];
}
export interface DeliverySettings {
    accelerated?: boolean;
    costPerResult?: number;
    costPerResultCurrency?: 'USD' | 'EUR' | 'GBP' | 'CAD';
}
export interface ConversionSettings {
    conversionEvent?: any;
    dataset?: any;
}
export interface Placement {
    facebook: boolean;
    instagram: boolean;
    audienceNetwork: boolean;
}
export interface AdTemplate {
    id: string;
    name: string;
    adDescription?: string;
    adCopy: AdCopy;
    targeting: Targeting;
    delivery?: DeliverySettings;
    conversion?: ConversionSettings;
    placement: Placement;
    specialAdCategories?: string[];
    optimizationGoal?: 'LINK_CLICKS' | 'CONVERSIONS' | 'REACH' | 'BRAND_AWARENESS' | 'VIDEO_VIEWS';
    billingEvent?: 'IMPRESSIONS' | 'LINK_CLICKS';
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateTemplateRequest {
    name: string;
    adDescription?: string;
    adCopy: AdCopy;
    targeting: Targeting;
    delivery?: DeliverySettings;
    conversion?: ConversionSettings;
    placement: Placement;
    specialAdCategories?: string[];
    optimizationGoal?: 'LINK_CLICKS' | 'CONVERSIONS' | 'REACH' | 'BRAND_AWARENESS' | 'VIDEO_VIEWS';
    billingEvent?: 'IMPRESSIONS' | 'LINK_CLICKS';
}
export interface UpdateTemplateRequest {
    name?: string;
    adDescription?: string;
    adCopy?: AdCopy;
    targeting?: Targeting;
    delivery?: DeliverySettings;
    conversion?: ConversionSettings;
    placement?: Placement;
    specialAdCategories?: string[];
    optimizationGoal?: 'LINK_CLICKS' | 'CONVERSIONS' | 'REACH' | 'BRAND_AWARENESS' | 'VIDEO_VIEWS';
    billingEvent?: 'IMPRESSIONS' | 'LINK_CLICKS';
}
export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface TemplateListResponse {
    templates: AdTemplate[];
    pagination: PaginationInfo;
}
export interface BulkAdRequest {
    templateId: string;
    media: string[];
    campaignName: string;
    adSetName: string;
    options: {
        createCampaign: boolean;
        createAdSet: boolean;
        status: 'ACTIVE' | 'PAUSED';
        campaignBudget?: number;
        adSetBudget?: number;
    };
}
export interface AdCreationJob {
    id: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    progress: number;
    totalAds: number;
    createdAds: number;
    failedAds: number;
    results: {
        campaignId?: string;
        adSetId?: string;
        adIds: string[];
        errors: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface AdCreationResponse {
    jobId: string;
    status: string;
    message: string;
}
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}
export interface ValidationResponse {
    success: boolean;
    error: string;
    message: string;
    data?: ValidationError[];
    timestamp: string;
}
export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
    code?: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    timestamp: string;
}
//# sourceMappingURL=index.d.ts.map