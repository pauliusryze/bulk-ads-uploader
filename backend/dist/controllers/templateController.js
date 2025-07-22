"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemplate = exports.updateTemplate = exports.getTemplate = exports.getTemplates = exports.createTemplate = void 0;
const templateService_1 = require("../services/templateService");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const createTemplate = async (req, res) => {
    try {
        const templateData = req.body;
        logger_1.logger.info('Creating new template', {
            name: templateData.name
        });
        const templateService = templateService_1.TemplateService.getInstance();
        const template = await templateService.createTemplate(templateData);
        res.status(201).json({
            success: true,
            data: template,
            message: 'Template created successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create template', {
            error: error instanceof Error ? error.message : 'Unknown error',
            body: req.body
        });
        if (error instanceof errors_1.AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.code || 'TEMPLATE_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create template',
            timestamp: new Date().toISOString()
        });
    }
};
exports.createTemplate = createTemplate;
const getTemplates = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        logger_1.logger.info('Getting templates', {
            page: page,
            limit: limit,
            search: search
        });
        const templateService = templateService_1.TemplateService.getInstance();
        const result = await templateService.getTemplates(page, limit, search);
        res.status(200).json({
            success: true,
            data: result,
            message: `Retrieved ${result.templates.length} templates`,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get templates', {
            error: error instanceof Error ? error.message : 'Unknown error',
            query: req.query
        });
        if (error instanceof errors_1.AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.code || 'TEMPLATE_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get templates',
            timestamp: new Date().toISOString()
        });
    }
};
exports.getTemplates = getTemplates;
const getTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        logger_1.logger.info('Getting template', {
            templateId: id
        });
        const templateService = templateService_1.TemplateService.getInstance();
        const template = await templateService.getTemplate(id);
        res.status(200).json({
            success: true,
            data: template,
            message: 'Template retrieved successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get template', {
            error: error instanceof Error ? error.message : 'Unknown error',
            templateId: req.params.id
        });
        if (error instanceof errors_1.AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.code || 'TEMPLATE_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get template',
            timestamp: new Date().toISOString()
        });
    }
};
exports.getTemplate = getTemplate;
const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        logger_1.logger.info('Updating template', {
            templateId: id,
            updates: Object.keys(updateData)
        });
        const templateService = templateService_1.TemplateService.getInstance();
        const template = await templateService.updateTemplate(id, updateData);
        res.status(200).json({
            success: true,
            data: template,
            message: 'Template updated successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update template', {
            error: error instanceof Error ? error.message : 'Unknown error',
            templateId: req.params.id,
            body: req.body
        });
        if (error instanceof errors_1.AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.code || 'TEMPLATE_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update template',
            timestamp: new Date().toISOString()
        });
    }
};
exports.updateTemplate = updateTemplate;
const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        logger_1.logger.info('Deleting template', {
            templateId: id
        });
        const templateService = templateService_1.TemplateService.getInstance();
        await templateService.deleteTemplate(id);
        res.status(200).json({
            success: true,
            message: 'Template deleted successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete template', {
            error: error instanceof Error ? error.message : 'Unknown error',
            templateId: req.params.id
        });
        if (error instanceof errors_1.AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.code || 'TEMPLATE_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete template',
            timestamp: new Date().toISOString()
        });
    }
};
exports.deleteTemplate = deleteTemplate;
//# sourceMappingURL=templateController.js.map