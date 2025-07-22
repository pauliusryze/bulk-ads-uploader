"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateService = void 0;
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const uuid_1 = require("uuid");
const templatesMap = new Map();
class TemplateService {
    constructor() { }
    static getInstance() {
        if (!TemplateService.instance) {
            TemplateService.instance = new TemplateService();
        }
        return TemplateService.instance;
    }
    async createTemplate(data) {
        try {
            const templateId = (0, uuid_1.v4)();
            const now = new Date();
            const template = {
                id: templateId,
                name: data.name,
                adDescription: data.adDescription || '',
                adCopy: data.adCopy,
                targeting: data.targeting,
                delivery: data.delivery,
                conversion: data.conversion,
                placement: data.placement,
                specialAdCategories: data.specialAdCategories || [],
                optimizationGoal: data.optimizationGoal || 'LINK_CLICKS',
                billingEvent: data.billingEvent || 'IMPRESSIONS',
                createdAt: now,
                updatedAt: now
            };
            templatesMap.set(templateId, template);
            logger_1.logger.info('Template created successfully', {
                templateId: templateId,
                name: data.name
            });
            return template;
        }
        catch (error) {
            logger_1.logger.error('Failed to create template', {
                error: error instanceof Error ? error.message : 'Unknown error',
                data: data
            });
            throw new errors_1.AppError(`Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getTemplates(page = 1, limit = 10, search) {
        try {
            let templates = Array.from(templatesMap.values());
            if (search) {
                const searchLower = search.toLowerCase();
                templates = templates.filter(template => template.name.toLowerCase().includes(searchLower) ||
                    (template.adDescription && template.adDescription.toLowerCase().includes(searchLower)));
            }
            const total = templates.length;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedTemplates = templates.slice(startIndex, endIndex);
            logger_1.logger.info('Templates retrieved successfully', {
                total: total,
                page: page,
                limit: limit,
                returned: paginatedTemplates.length
            });
            return {
                templates: paginatedTemplates,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: endIndex < total,
                    hasPrev: page > 1
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get templates', {
                error: error instanceof Error ? error.message : 'Unknown error',
                page: page,
                limit: limit,
                search: search
            });
            throw new errors_1.AppError(`Failed to get templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getTemplate(templateId) {
        try {
            const template = templatesMap.get(templateId);
            if (!template) {
                throw new errors_1.AppError('Template not found', 404);
            }
            logger_1.logger.info('Template retrieved successfully', {
                templateId: templateId
            });
            return template;
        }
        catch (error) {
            logger_1.logger.error('Failed to get template', {
                error: error instanceof Error ? error.message : 'Unknown error',
                templateId: templateId
            });
            if (error instanceof errors_1.AppError) {
                throw error;
            }
            throw new errors_1.AppError(`Failed to get template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateTemplate(templateId, data) {
        try {
            const existingTemplate = templatesMap.get(templateId);
            if (!existingTemplate) {
                throw new errors_1.AppError('Template not found', 404);
            }
            const updatedTemplate = {
                ...existingTemplate,
                name: data.name ?? existingTemplate.name,
                adDescription: data.adDescription ?? existingTemplate.adDescription,
                adCopy: data.adCopy ?? existingTemplate.adCopy,
                targeting: data.targeting ?? existingTemplate.targeting,
                delivery: data.delivery ?? existingTemplate.delivery,
                conversion: data.conversion ?? existingTemplate.conversion,
                placement: data.placement ?? existingTemplate.placement,
                specialAdCategories: data.specialAdCategories ?? existingTemplate.specialAdCategories,
                optimizationGoal: data.optimizationGoal ?? existingTemplate.optimizationGoal,
                billingEvent: data.billingEvent ?? existingTemplate.billingEvent,
                updatedAt: new Date()
            };
            templatesMap.set(templateId, updatedTemplate);
            logger_1.logger.info('Template updated successfully', {
                templateId: templateId,
                name: updatedTemplate.name
            });
            return updatedTemplate;
        }
        catch (error) {
            logger_1.logger.error('Failed to update template', {
                error: error instanceof Error ? error.message : 'Unknown error',
                templateId: templateId,
                data: data
            });
            if (error instanceof errors_1.AppError) {
                throw error;
            }
            throw new errors_1.AppError(`Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteTemplate(templateId) {
        try {
            const template = templatesMap.get(templateId);
            if (!template) {
                throw new errors_1.AppError('Template not found', 404);
            }
            templatesMap.delete(templateId);
            logger_1.logger.info('Template deleted successfully', {
                templateId: templateId,
                name: template.name
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete template', {
                error: error instanceof Error ? error.message : 'Unknown error',
                templateId: templateId
            });
            if (error instanceof errors_1.AppError) {
                throw error;
            }
            throw new errors_1.AppError(`Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    getTemplateCount() {
        return templatesMap.size;
    }
}
exports.TemplateService = TemplateService;
//# sourceMappingURL=templateService.js.map