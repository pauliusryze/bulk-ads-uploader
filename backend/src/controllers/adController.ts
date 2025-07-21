import { Request, Response } from 'express';
import { AdService } from '../services/adService';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { BulkAdRequest } from '../types';

/**
 * Create bulk ads from template and media
 * POST /api/ads/bulk
 */
export const createBulkAds = async (req: Request, res: Response): Promise<void> => {
  try {
    const request: BulkAdRequest = req.body;
    
    logger.info('Starting bulk ad creation', {
      templateId: request.templateId,
      totalMedia: request.media.length,
      campaignName: request.campaignName
    });

    const adService = AdService.getInstance();
    const result = await adService.createBulkAds(request);

    res.status(202).json({
      success: true,
      data: result,
      message: 'Bulk ad creation job started successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to start bulk ad creation', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body
    });

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.code || 'AD_CREATION_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to start bulk ad creation',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get job status
 * GET /api/ads/jobs/:jobId
 */
export const getJobStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    logger.info('Getting job status', {
      jobId: jobId
    });

    const adService = AdService.getInstance();
    const job = await adService.getJobStatus(jobId);

    res.status(200).json({
      success: true,
      data: job,
      message: 'Job status retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get job status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId: req.params.jobId
    });

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.code || 'JOB_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get job status',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all jobs
 * GET /api/ads/jobs
 */
export const getAllJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('Getting all jobs');

    const adService = AdService.getInstance();
    const jobs = await adService.getAllJobs();

    res.status(200).json({
      success: true,
      data: {
        jobs: jobs,
        total: jobs.length
      },
      message: `Retrieved ${jobs.length} jobs`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get all jobs', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.code || 'JOB_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get all jobs',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete a job
 * DELETE /api/ads/jobs/:jobId
 */
export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    logger.info('Deleting job', {
      jobId: jobId
    });

    const adService = AdService.getInstance();
    await adService.deleteJob(jobId);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to delete job', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId: req.params.jobId
    });

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.code || 'JOB_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete job',
      timestamp: new Date().toISOString()
    });
  }
}; 