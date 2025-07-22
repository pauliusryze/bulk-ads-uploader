import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { FacebookService } from './facebookService';
import { TemplateService } from './templateService';
import { 
  BulkAdRequest, 
  AdCreationJob, 
  AdCreationResponse,
  AdTemplate 
} from '../types';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for ad creation jobs (in production, use a database)
const jobsMap: Map<string, AdCreationJob> = new Map();

export class AdService {
  private static instance: AdService;

  private constructor() {}

  public static getInstance(): AdService {
    if (!AdService.instance) {
      AdService.instance = new AdService();
    }
    return AdService.instance;
  }

  /**
   * Create bulk ads from template and media
   */
  async createBulkAds(request: BulkAdRequest): Promise<AdCreationResponse> {
    try {
      // Validate Facebook API is initialized
      const facebookService = FacebookService.getInstance();
      if (!facebookService.isInitialized()) {
        throw new AppError('Facebook API not initialized. Please validate credentials first.', 400);
      }

      // Get template
      const templateService = TemplateService.getInstance();
      const template = await templateService.getTemplate(request.templateId);

      // Create job
      const jobId = uuidv4();
      const now = new Date();
      
      const job: AdCreationJob = {
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

      // Start async processing
      this.processBulkAds(jobId, request, template);

      logger.info('Bulk ad creation job started', {
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

    } catch (error) {
      logger.error('Failed to start bulk ad creation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        request: request
      });

      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to start bulk ad creation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process bulk ads asynchronously
   */
  private async processBulkAds(jobId: string, request: BulkAdRequest, template: AdTemplate): Promise<void> {
    const job = jobsMap.get(jobId);
    if (!job) return;

    try {
      // Update job status
      job.status = 'PROCESSING';
      job.updatedAt = new Date();
      jobsMap.set(jobId, job);

      const facebookService = FacebookService.getInstance();
      let campaignId: string | undefined;
      let adSetId: string | undefined;

      // Create campaign if requested
      if (request.options.createCampaign) {
        try {
          campaignId = await facebookService.createCampaign(
            request.campaignName,
            request.options.status
          );
          job.results.campaignId = campaignId;
          logger.info('Campaign created successfully', { jobId, campaignId });
        } catch (error) {
          const errorMsg = `Failed to create campaign: ${error instanceof Error ? error.message : 'Unknown error'}`;
          job.results.errors.push(errorMsg);
          logger.error('Campaign creation failed', { jobId, error: errorMsg });
        }
      }

      // Create ad set if requested
      if (request.options.createAdSet && campaignId) {
        try {
          // Use delivery settings for budget (default to 10 if not specified)
          const budgetAmount = template.delivery?.costPerResult || 10;

          adSetId = await facebookService.createAdSet(
            campaignId,
            request.adSetName,
            template.targeting,
            { amount: budgetAmount, currency: template.delivery?.costPerResultCurrency || 'USD', type: 'DAILY' },
            request.options.status
          );
          job.results.adSetId = adSetId;
          logger.info('Ad Set created successfully', { jobId, adSetId });
        } catch (error) {
          const errorMsg = `Failed to create ad set: ${error instanceof Error ? error.message : 'Unknown error'}`;
          job.results.errors.push(errorMsg);
          logger.error('Ad Set creation failed', { jobId, error: errorMsg });
        }
      }

      // Create ads for each media file
      for (let i = 0; i < request.media.length; i++) {
        const mediaId = request.media[i];
        
        try {
          // Upload media to Facebook (placeholder for now)
          const mediaHash = await facebookService.uploadImage(Buffer.from(''), mediaId);

          // Create ad
          const adId = await facebookService.createAd(
            adSetId || 'default-adset-id', // In real implementation, you'd handle this properly
            `${template.name} - Ad ${i + 1}`,
            template.adCopy,
            mediaHash,
            request.options.status
          );

          job.results.adIds.push(adId);
          job.createdAds++;
          
          logger.info('Ad created successfully', { jobId, adId, mediaId });

        } catch (error) {
          const errorMsg = `Failed to create ad for media ${mediaId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          job.results.errors.push(errorMsg);
          job.failedAds++;
          logger.error('Ad creation failed', { jobId, mediaId, error: errorMsg });
        }

        // Update progress
        job.progress = Math.round(((i + 1) / request.media.length) * 100);
        job.updatedAt = new Date();
        jobsMap.set(jobId, job);
      }

      // Update final status
      job.status = job.failedAds === request.media.length ? 'FAILED' : 'COMPLETED';
      job.updatedAt = new Date();
      jobsMap.set(jobId, job);

      logger.info('Bulk ad creation job completed', {
        jobId: jobId,
        status: job.status,
        createdAds: job.createdAds,
        failedAds: job.failedAds
      });

    } catch (error) {
      // Handle unexpected errors
      job.status = 'FAILED';
      job.updatedAt = new Date();
      job.results.errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      jobsMap.set(jobId, job);

      logger.error('Bulk ad creation job failed', {
        jobId: jobId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<AdCreationJob> {
    try {
      const job = jobsMap.get(jobId);

      if (!job) {
        throw new AppError('Job not found', 404);
      }

      logger.info('Job status retrieved', {
        jobId: jobId,
        status: job.status,
        progress: job.progress
      });

      return job;

    } catch (error) {
      logger.error('Failed to get job status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        jobId: jobId
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to get job status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all jobs
   */
  async getAllJobs(): Promise<AdCreationJob[]> {
    try {
      const jobs = Array.from(jobsMap.values());
      
      logger.info('All jobs retrieved', {
        totalJobs: jobs.length
      });

      return jobs;

    } catch (error) {
      logger.error('Failed to get all jobs', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new AppError(`Failed to get all jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<void> {
    try {
      const job = jobsMap.get(jobId);

      if (!job) {
        throw new AppError('Job not found', 404);
      }

      jobsMap.delete(jobId);

      logger.info('Job deleted successfully', {
        jobId: jobId
      });

    } catch (error) {
      logger.error('Failed to delete job', {
        error: error instanceof Error ? error.message : 'Unknown error',
        jobId: jobId
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to delete job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 