declare module 'facebook-nodejs-business-sdk' {
  export class FacebookAdsApi {
    static init(accessToken: string): void;
    static getInstance(): FacebookAdsApi;
    getUser(): Promise<any>;
  }

  export class AdAccount {
    constructor(adAccountId: string);
    get(fields: string[]): Promise<any>;
    createCampaign(params: any[], data: any): Promise<any>;
    createAdSet(params: any[], data: any): Promise<any>;
    createAdCreative(params: any[], data: any): Promise<any>;
    createAd(params: any[], data: any): Promise<any>;
  }

  export class Campaign {
    constructor(campaignId: string);
    get(fields: string[]): Promise<any>;
  }

  export class AdSet {
    constructor(adSetId: string);
    get(fields: string[]): Promise<any>;
  }

  export class Ad {
    constructor(adId: string);
    get(fields: string[]): Promise<any>;
  }
} 