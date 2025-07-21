import { Request, Response } from 'express';
import { TemplateService } from '../services/templateService';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { CreateTemplateRequest, UpdateTemplateRequest } from '../types';

/**
 * Create a new ad template
 * POST /api/templates
 */
export const createTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const templateData: CreateTemplateRequest = req.body;
    
    logger.info('Creating new template', {
      name: templateData.name
    });

    const templateService = TemplateService.getInstance();
    const template = await templateService.createTemplate(templateData);

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to create template', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body
    });

    if (error instanceof AppError) {
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

/**
 * Get all templates with pagination and search
 * GET /api/templates
 */
export const getTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    logger.info('Getting templates', {
      page: page,
      limit: limit,
      search: search
    });

    const templateService = TemplateService.getInstance();
    const result = await templateService.getTemplates(page, limit, search);

    res.status(200).json({
      success: true,
      data: result,
      message: `Retrieved ${result.templates.length} templates`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get templates', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.query
    });

    if (error instanceof AppError) {
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

/**
 * Get a specific template by ID
 * GET /api/templates/:id
 */
export const getTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    logger.info('Getting template', {
      templateId: id
    });

    const templateService = TemplateService.getInstance();
    const template = await templateService.getTemplate(id);

    res.status(200).json({
      success: true,
      data: template,
      message: 'Template retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get template', {
      error: error instanceof Error ? error.message : 'Unknown error',
      templateId: req.params.id
    });

    if (error instanceof AppError) {
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

/**
 * Update an existing template
 * PUT /api/templates/:id
 */
export const updateTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateTemplateRequest = req.body;

    logger.info('Updating template', {
      templateId: id,
      updates: Object.keys(updateData)
    });

    const templateService = TemplateService.getInstance();
    const template = await templateService.updateTemplate(id, updateData);

    res.status(200).json({
      success: true,
      data: template,
      message: 'Template updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to update template', {
      error: error instanceof Error ? error.message : 'Unknown error',
      templateId: req.params.id,
      body: req.body
    });

    if (error instanceof AppError) {
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

/**
 * Delete a template
 * DELETE /api/templates/:id
 */
export const deleteTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    logger.info('Deleting template', {
      templateId: id
    });

    const templateService = TemplateService.getInstance();
    await templateService.deleteTemplate(id);

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to delete template', {
      error: error instanceof Error ? error.message : 'Unknown error',
      templateId: req.params.id
    });

    if (error instanceof AppError) {
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