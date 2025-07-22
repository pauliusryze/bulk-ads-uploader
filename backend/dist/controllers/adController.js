"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteJob = exports.getAllJobs = exports.getJobStatus = exports.createBulkAds = void 0;
const adService_1 = require("../services/adService");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const createBulkAds = async (req, res) => {
    try {
        const request = req.body;
        logger_1.logger.info('Starting bulk ad creation', {
            templateId: request.templateId,
            totalMedia: request.media.length,
            campaignName: request.campaignName
        });
        const adService = adService_1.AdService.getInstance();
        const result = await adService.createBulkAds(request);
        res.status(202).json({
            success: true,
            data: result,
            message: 'Bulk ad creation job started successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start bulk ad creation', {
            error: error instanceof Error ? error.message : 'Unknown error',
            body: req.body
        });
        if (error instanceof errors_1.AppError) {
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
exports.createBulkAds = createBulkAds;
const getJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        logger_1.logger.info('Getting job status', {
            jobId: jobId
        });
        const adService = adService_1.AdService.getInstance();
        const job = await adService.getJobStatus(jobId);
        res.status(200).json({
            success: true,
            data: job,
            message: 'Job status retrieved successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get job status', {
            error: error instanceof Error ? error.message : 'Unknown error',
            jobId: req.params.jobId
        });
        if (error instanceof errors_1.AppError) {
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
exports.getJobStatus = getJobStatus;
const getAllJobs = async (req, res) => {
    try {
        logger_1.logger.info('Getting all jobs');
        const adService = adService_1.AdService.getInstance();
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get all jobs', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        if (error instanceof errors_1.AppError) {
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
exports.getAllJobs = getAllJobs;
const deleteJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        logger_1.logger.info('Deleting job', {
            jobId: jobId
        });
        const adService = adService_1.AdService.getInstance();
        await adService.deleteJob(jobId);
        res.status(200).json({
            success: true,
            message: 'Job deleted successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete job', {
            error: error instanceof Error ? error.message : 'Unknown error',
            jobId: req.params.jobId
        });
        if (error instanceof errors_1.AppError) {
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
exports.deleteJob = deleteJob;
//# sourceMappingURL=adController.js.map