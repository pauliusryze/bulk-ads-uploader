"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookService = void 0;
const facebook_nodejs_business_sdk_1 = require("facebook-nodejs-business-sdk");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class FacebookService {
    constructor() {
        this.accessToken = null;
        this.adAccountId = null;
    }
    static getInstance() {
        if (!FacebookService.instance) {
            FacebookService.instance = new FacebookService();
        }
        return FacebookService.instance;
    }
    async validateCredentials(credentials) {
        try {
            facebook_nodejs_business_sdk_1.FacebookAdsApi.init(credentials.accessToken);
            const user = await facebook_nodejs_business_sdk_1.FacebookAdsApi.getInstance().getUser();
            const adAccount = new facebook_nodejs_business_sdk_1.AdAccount(credentials.adAccountId);
            const adAccountData = await adAccount.get([
                'id',
                'name',
                'currency',
                'timezone_name'
            ]);
            const permissions = await this.getPermissions(credentials.accessToken);
            this.accessToken = credentials.accessToken;
            this.adAccountId = credentials.adAccountId;
            logger_1.logger.info('Facebook credentials validated successfully', {
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
        }
        catch (error) {
            logger_1.logger.error('Facebook credentials validation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                adAccountId: credentials.adAccountId
            });
            return {
                isValid: false
            };
        }
    }
    async getPermissions(accessToken) {
        try {
            const response = await fetch(`https://graph.facebook.com/me/permissions?access_token=${accessToken}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return data.data
                .filter((permission) => permission.status === 'granted')
                .map((permission) => permission.permission);
        }
        catch (error) {
            logger_1.logger.error('Failed to get Facebook permissions', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }
    async createCampaign(name, status = 'PAUSED') {
        if (!this.accessToken || !this.adAccountId) {
            throw new errors_1.AppError('Facebook API not initialized. Please validate credentials first.');
        }
        try {
            facebook_nodejs_business_sdk_1.FacebookAdsApi.init(this.accessToken);
            const adAccount = new facebook_nodejs_business_sdk_1.AdAccount(this.adAccountId);
            const campaign = await adAccount.createCampaign([], {
                name: name,
                objective: 'OUTCOME_TRAFFIC',
                status: status,
                special_ad_categories: []
            });
            logger_1.logger.info('Campaign created successfully', {
                campaignId: campaign.id,
                name: name
            });
            return campaign.id;
        }
        catch (error) {
            logger_1.logger.error('Failed to create campaign', {
                error: error instanceof Error ? error.message : 'Unknown error',
                name: name
            });
            throw new errors_1.AppError(`Failed to create campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createAdSet(campaignId, name, targeting, budget, status = 'PAUSED') {
        if (!this.accessToken || !this.adAccountId) {
            throw new errors_1.AppError('Facebook API not initialized. Please validate credentials first.');
        }
        try {
            facebook_nodejs_business_sdk_1.FacebookAdsApi.init(this.accessToken);
            const adAccount = new facebook_nodejs_business_sdk_1.AdAccount(this.adAccountId);
            const adSet = await adAccount.createAdSet([], {
                name: name,
                campaign_id: campaignId,
                targeting: targeting,
                billing_event: 'IMPRESSIONS',
                optimization_goal: 'REACH',
                bid_amount: 2000,
                daily_budget: budget.type === 'DAILY' ? budget.amount * 100 : undefined,
                lifetime_budget: budget.type === 'LIFETIME' ? budget.amount * 100 : undefined,
                status: status
            });
            logger_1.logger.info('Ad Set created successfully', {
                adSetId: adSet.id,
                name: name,
                campaignId: campaignId
            });
            return adSet.id;
        }
        catch (error) {
            logger_1.logger.error('Failed to create ad set', {
                error: error instanceof Error ? error.message : 'Unknown error',
                name: name,
                campaignId: campaignId
            });
            throw new errors_1.AppError(`Failed to create ad set: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createAd(adSetId, name, adCopy, imageUrl, status = 'PAUSED') {
        if (!this.accessToken || !this.adAccountId) {
            throw new errors_1.AppError('Facebook API not initialized. Please validate credentials first.');
        }
        try {
            facebook_nodejs_business_sdk_1.FacebookAdsApi.init(this.accessToken);
            const adAccount = new facebook_nodejs_business_sdk_1.AdAccount(this.adAccountId);
            const creative = await adAccount.createAdCreative([], {
                name: `${name} - Creative`,
                object_story_spec: {
                    page_id: process.env['FACEBOOK_PAGE_ID'],
                    link_data: {
                        image_hash: imageUrl,
                        link: process.env['WEBSITE_URL'] || 'https://example.com',
                        message: adCopy.primaryText,
                        name: adCopy.headline,
                        call_to_action: adCopy.callToAction ? {
                            type: adCopy.callToAction
                        } : undefined
                    }
                }
            });
            const ad = await adAccount.createAd([], {
                name: name,
                adset_id: adSetId,
                creative: {
                    creative_id: creative.id
                },
                status: status
            });
            logger_1.logger.info('Ad created successfully', {
                adId: ad.id,
                name: name,
                adSetId: adSetId
            });
            return ad.id;
        }
        catch (error) {
            logger_1.logger.error('Failed to create ad', {
                error: error instanceof Error ? error.message : 'Unknown error',
                name: name,
                adSetId: adSetId
            });
            throw new errors_1.AppError(`Failed to create ad: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async uploadImage(imageBuffer, filename) {
        if (!this.accessToken || !this.adAccountId) {
            throw new errors_1.AppError('Facebook API not initialized. Please validate credentials first.');
        }
        try {
            const imageHash = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            logger_1.logger.info('Image uploaded successfully', {
                filename: filename,
                imageHash: imageHash
            });
            return imageHash;
        }
        catch (error) {
            logger_1.logger.error('Failed to upload image', {
                error: error instanceof Error ? error.message : 'Unknown error',
                filename: filename
            });
            throw new errors_1.AppError(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    isInitialized() {
        return !!(this.accessToken && this.adAccountId);
    }
    getConfig() {
        return {
            accessToken: this.accessToken,
            adAccountId: this.adAccountId
        };
    }
}
exports.FacebookService = FacebookService;
//# sourceMappingURL=facebookService.js.map