export declare const createTables: () => Promise<void>;
export declare class User {
    static create(facebookUserId: string, accessToken: string, adAccountId: string, permissions?: any): Promise<any>;
    static findByFacebookId(facebookUserId: string): Promise<any>;
}
export declare class Job {
    static create(userId: number, jobId: string, totalItems: number): Promise<any>;
    static updateProgress(jobId: string, progress: number, completedItems: number, failedItems: number): Promise<any>;
    static updateStatus(jobId: string, status: string, resultData?: any, errorMessage?: string): Promise<any>;
    static findById(jobId: string): Promise<any>;
    static findByUserId(userId: number): Promise<any[]>;
}
export declare class AdHistory {
    static create(userId: number, jobId: string, adData: any): Promise<any>;
    static findByJobId(jobId: string): Promise<any[]>;
}
//# sourceMappingURL=models.d.ts.map