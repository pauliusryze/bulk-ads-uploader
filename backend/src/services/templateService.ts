import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { 
  AdTemplate, 
  CreateTemplateRequest, 
  UpdateTemplateRequest,
  TemplateListResponse 
} from '../types';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for templates (in production, use a database)
const templatesMap: Map<string, AdTemplate> = new Map();

export class TemplateService {
  private static instance: TemplateService;

  private constructor() {}

  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  /**
   * Create a new ad template
   */
  async createTemplate(data: CreateTemplateRequest): Promise<AdTemplate> {
    try {
      const templateId = uuidv4();
      const now = new Date();

      // Ensure budget amount is a number
      const budgetAmount = typeof data.budget.amount === 'string' 
        ? parseFloat(data.budget.amount) 
        : data.budget.amount;

      if (isNaN(budgetAmount) || budgetAmount <= 0) {
        throw new AppError('Invalid budget amount. Must be a positive number.', 400);
      }

      const template: AdTemplate = {
        id: templateId,
        name: data.name,
        description: data.description || '',
        adCopy: data.adCopy,
        targeting: data.targeting,
        budget: {
          ...data.budget,
          amount: budgetAmount
        },
        placement: data.placement,
        createdAt: now,
        updatedAt: now
      };

      templatesMap.set(templateId, template);

      logger.info('Template created successfully', {
        templateId: templateId,
        name: data.name
      });

      return template;

    } catch (error) {
      logger.error('Failed to create template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data: data
      });
      throw new AppError(`Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all templates with pagination and search
   */
  async getTemplates(page: number = 1, limit: number = 10, search?: string): Promise<TemplateListResponse> {
    try {
      let templates = Array.from(templatesMap.values());

      // Apply search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        templates = templates.filter(template => 
          template.name.toLowerCase().includes(searchLower) ||
          template.description.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination
      const total = templates.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTemplates = templates.slice(startIndex, endIndex);

      logger.info('Templates retrieved successfully', {
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

    } catch (error) {
      logger.error('Failed to get templates', {
        error: error instanceof Error ? error.message : 'Unknown error',
        page: page,
        limit: limit,
        search: search
      });
      throw new AppError(`Failed to get templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(templateId: string): Promise<AdTemplate> {
    try {
      const template = templatesMap.get(templateId);

      if (!template) {
        throw new AppError('Template not found', 404);
      }

      logger.info('Template retrieved successfully', {
        templateId: templateId
      });

      return template;

    } catch (error) {
      logger.error('Failed to get template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId: templateId
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to get template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(templateId: string, data: UpdateTemplateRequest): Promise<AdTemplate> {
    try {
      const existingTemplate = templatesMap.get(templateId);

      if (!existingTemplate) {
        throw new AppError('Template not found', 404);
      }

      const updatedTemplate: AdTemplate = {
        ...existingTemplate,
        name: data.name ?? existingTemplate.name,
        description: data.description ?? existingTemplate.description,
        adCopy: data.adCopy ?? existingTemplate.adCopy,
        targeting: data.targeting ?? existingTemplate.targeting,
        budget: data.budget ?? existingTemplate.budget,
        placement: data.placement ?? existingTemplate.placement,
        updatedAt: new Date()
      };

      templatesMap.set(templateId, updatedTemplate);

      logger.info('Template updated successfully', {
        templateId: templateId,
        name: updatedTemplate.name
      });

      return updatedTemplate;

    } catch (error) {
      logger.error('Failed to update template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId: templateId,
        data: data
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const template = templatesMap.get(templateId);

      if (!template) {
        throw new AppError('Template not found', 404);
      }

      templatesMap.delete(templateId);

      logger.info('Template deleted successfully', {
        templateId: templateId,
        name: template.name
      });

    } catch (error) {
      logger.error('Failed to delete template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId: templateId
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get template count
   */
  getTemplateCount(): number {
    return templatesMap.size;
  }
} 