import { BulkAdRequest, AdCreationJob, AdCreationResponse } from '../types';
export declare class AdService {
    private static instance;
    private constructor();
    static getInstance(): AdService;
    createBulkAds(request: BulkAdRequest): Promise<AdCreationResponse>;
    private processBulkAds;
    getJobStatus(jobId: string): Promise<AdCreationJob>;
    getAllJobs(): Promise<AdCreationJob[]>;
    deleteJob(jobId: string): Promise<void>;
}
//# sourceMappingURL=adService.d.ts.map