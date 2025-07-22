"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdService = void 0;
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const facebookService_1 = require("./facebookService");
const templateService_1 = require("./templateService");
const uuid_1 = require("uuid");
const jobsMap = new Map();
class AdService {
    constructor() { }
    static getInstance() {
        if (!AdService.instance) {
            AdService.instance = new AdService();
        }
        return AdService.instance;
    }
    async createBulkAds(request) {
        try {
            const facebookService = facebookService_1.FacebookService.getInstance();
            if (!facebookService.isInitialized()) {
                throw new errors_1.AppError('Facebook API not initialized. Please validate credentials first.', 400);
            }
            const templateService = templateService_1.TemplateService.getInstance();
            const template = await templateService.getTemplate(request.templateId);
            const jobId = (0, uuid_1.v4)();
            const now = new Date();
            const job = {
                id: jobId,
                status: 'PENDING',
                progress: 0,
                totalAds: request.media.length,
                createdAds: 0,
                failedAds: 0,
                results: {
                    adIds: [],
                    errors: []
                },
                createdAt: now,
                updatedAt: now
            };
            jobsMap.set(jobId, job);
            this.processBulkAds(jobId, request, template);
            logger_1.logger.info('Bulk ad creation job started', {
                jobId: jobId,
                templateId: request.templateId,
                totalAds: request.media.length,
                campaignName: request.campaignName
            });
            return {
                jobId: jobId,
                status: 'PENDING',
                message: 'Bulk ad creation job started successfully'
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to start bulk ad creation', {
                error: error instanceof Error ? error.message : 'Unknown error',
                request: request
            });
            if (error instanceof errors_1.AppError) {
                throw error;
            }
            throw new errors_1.AppError(`Failed to start bulk ad creation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async processBulkAds(jobId, request, template) {
        const job = jobsMap.get(jobId);
        if (!job)
            return;
        try {
            job.status = 'PROCESSING';
            job.updatedAt = new Date();
            jobsMap.set(jobId, job);
            const facebookService = facebookService_1.FacebookService.getInstance();
            let campaignId;
            let adSetId;
            if (request.options.createCampaign) {
                try {
                    campaignId = await facebookService.createCampaign(request.campaignName, request.options.status);
                    job.results.campaignId = campaignId;
                    logger_1.logger.info('Campaign created successfully', { jobId, campaignId });
                }
                catch (error) {
                    const errorMsg = `Failed to create campaign: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    job.results.errors.push(errorMsg);
                    logger_1.logger.error('Campaign creation failed', { jobId, error: errorMsg });
                }
            }
            if (request.options.createAdSet && campaignId) {
                try {
                    const budgetAmount = template.delivery?.costPerResult || 10;
                    adSetId = await facebookService.createAdSet(campaignId, request.adSetName, template.targeting, { amount: budgetAmount, currency: template.delivery?.costPerResultCurrency || 'USD', type: 'DAILY' }, request.options.status);
                    job.results.adSetId = adSetId;
                    logger_1.logger.info('Ad Set created successfully', { jobId, adSetId });
                }
                catch (error) {
                    const errorMsg = `Failed to create ad set: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    job.results.errors.push(errorMsg);
                    logger_1.logger.error('Ad Set creation failed', { jobId, error: errorMsg });
                }
            }
            for (let i = 0; i < request.media.length; i++) {
                const mediaId = request.media[i];
                try {
                    const mediaHash = await facebookService.uploadImage(Buffer.from(''), mediaId);
                    const adId = await facebookService.createAd(adSetId || 'default-adset-id', `${template.name} - Ad ${i + 1}`, template.adCopy, mediaHash, request.options.status);
                    job.results.adIds.push(adId);
                    job.createdAds++;
                    logger_1.logger.info('Ad created successfully', { jobId, adId, mediaId });
                }
                catch (error) {
                    const errorMsg = `Failed to create ad for media ${mediaId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    job.results.errors.push(errorMsg);
                    job.failedAds++;
                    logger_1.logger.error('Ad creation failed', { jobId, mediaId, error: errorMsg });
                }
                job.progress = Math.round(((i + 1) / request.media.length) * 100);
                job.updatedAt = new Date();
                jobsMap.set(jobId, job);
            }
            job.status = job.failedAds === request.media.length ? 'FAILED' : 'COMPLETED';
            job.updatedAt = new Date();
            jobsMap.set(jobId, job);
            logger_1.logger.info('Bulk ad creation job completed', {
                jobId: jobId,
                status: job.status,
                createdAds: job.createdAds,
                failedAds: job.failedAds
            });
        }
        catch (error) {
            job.status = 'FAILED';
            job.updatedAt = new Date();
            job.results.errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            jobsMap.set(jobId, job);
            logger_1.logger.error('Bulk ad creation job failed', {
                jobId: jobId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getJobStatus(jobId) {
        try {
            const job = jobsMap.get(jobId);
            if (!job) {
                throw new errors_1.AppError('Job not found', 404);
            }
            logger_1.logger.info('Job status retrieved', {
                jobId: jobId,
                status: job.status,
                progress: job.progress
            });
            return job;
        }
        catch (error) {
            logger_1.logger.error('Failed to get job status', {
                error: error instanceof Error ? error.message : 'Unknown error',
                jobId: jobId
            });
            if (error instanceof errors_1.AppError) {
                throw error;
            }
            throw new errors_1.AppError(`Failed to get job status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getAllJobs() {
        try {
            const jobs = Array.from(jobsMap.values());
            logger_1.logger.info('All jobs retrieved', {
                totalJobs: jobs.length
            });
            return jobs;
        }
        catch (error) {
            logger_1.logger.error('Failed to get all jobs', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new errors_1.AppError(`Failed to get all jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteJob(jobId) {
        try {
            const job = jobsMap.get(jobId);
            if (!job) {
                throw new errors_1.AppError('Job not found', 404);
            }
            jobsMap.delete(jobId);
            logger_1.logger.info('Job deleted successfully', {
                jobId: jobId
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete job', {
                error: error instanceof Error ? error.message : 'Unknown error',
                jobId: jobId
            });
            if (error instanceof errors_1.AppError) {
                throw error;
            }
            throw new errors_1.AppError(`Failed to delete job: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.AdService = AdService;
//# sourceMappingURL=adService.js.map