import { FacebookCredentials, FacebookAdAccount } from '../types';
export declare class FacebookService {
    private static instance;
    private accessToken;
    private adAccountId;
    private constructor();
    static getInstance(): FacebookService;
    validateCredentials(credentials: FacebookCredentials): Promise<{
        isValid: boolean;
        adAccount?: FacebookAdAccount;
        permissions?: string[];
    }>;
    private getPermissions;
    createCampaign(name: string, status?: 'ACTIVE' | 'PAUSED'): Promise<string>;
    createAdSet(campaignId: string, name: string, targeting: any, budget: {
        amount: number;
        currency: string;
        type: 'DAILY' | 'LIFETIME';
    }, status?: 'ACTIVE' | 'PAUSED'): Promise<string>;
    createAd(adSetId: string, name: string, adCopy: {
        headline: string;
        primaryText: string;
        callToAction?: string;
    }, imageUrl: string, status?: 'ACTIVE' | 'PAUSED'): Promise<string>;
    uploadImage(imageBuffer: Buffer, filename: string): Promise<string>;
    isInitialized(): boolean;
    getConfig(): {
        accessToken: string | null;
        adAccountId: string | null;
    };
}
//# sourceMappingURL=facebookService.d.ts.map