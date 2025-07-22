import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Facebook Authentication Schema
export const facebookAuthSchema = Joi.object({
  appId: Joi.string().required().messages({
    'string.empty': 'App ID is required',
    'any.required': 'App ID is required'
  }),
  appSecret: Joi.string().required().messages({
    'string.empty': 'App Secret is required',
    'any.required': 'App Secret is required'
  }),
  accessToken: Joi.string().required().messages({
    'string.empty': 'Access Token is required',
    'any.required': 'Access Token is required'
  }),
  adAccountId: Joi.string().pattern(/^act_\d+$/).required().messages({
    'string.pattern.base': 'Ad Account ID must be in format: act_123456789',
    'any.required': 'Ad Account ID is required'
  })
});

// Template Schema - Updated to match frontend structure
export const templateSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Template name is required',
    'string.min': 'Template name must be at least 1 character',
    'string.max': 'Template name must be less than 100 characters',
    'any.required': 'Template name is required'
  }),
  adDescription: Joi.string().max(500).optional().messages({
    'string.max': 'Description must be less than 500 characters'
  }),
  adCopy: Joi.object({
    headline: Joi.string().min(1).max(40).required().messages({
      'string.empty': 'Headline is required',
      'string.min': 'Headline must be at least 1 character',
      'string.max': 'Headline must be less than 40 characters',
      'any.required': 'Headline is required'
    }),
    primaryText: Joi.string().min(1).max(125).required().messages({
      'string.empty': 'Primary text is required',
      'string.min': 'Primary text must be at least 1 character',
      'string.max': 'Primary text must be less than 125 characters',
      'any.required': 'Primary text is required'
    }),
    callToAction: Joi.string().valid(
      'SHOP_NOW', 'LEARN_MORE', 'SIGN_UP', 'BOOK_NOW', 'CONTACT_US'
    ).optional(),
    description: Joi.string().max(125).optional().messages({
      'string.max': 'Description must be less than 125 characters'
    })
  }).required(),
  targeting: Joi.object({
    ageMin: Joi.number().min(13).max(65).optional().messages({
      'number.min': 'Minimum age must be at least 13',
      'number.max': 'Maximum age must be 65 or less'
    }),
    ageMax: Joi.number().min(13).max(65).optional().messages({
      'number.min': 'Maximum age must be at least 13',
      'number.max': 'Maximum age must be 65 or less'
    }),
    locations: Joi.object({
      inclusion: Joi.array().items(Joi.string()).optional(),
      exclusion: Joi.array().items(Joi.string()).optional()
    }).optional(),
    interests: Joi.array().items(Joi.string()).optional(),
    customAudienceExclusion: Joi.array().items(Joi.string()).optional(),
    languages: Joi.array().items(Joi.string()).optional()
  }).required(),
  delivery: Joi.object({
    accelerated: Joi.boolean().optional(),
    costPerResult: Joi.number().optional(),
    costPerResultCurrency: Joi.string().valid('USD', 'EUR', 'GBP', 'CAD').optional()
  }).optional(),
  conversion: Joi.object({
    conversionEvent: Joi.any().optional(),
    dataset: Joi.any().optional()
  }).optional(),
  placement: Joi.object({
    facebook: Joi.boolean().required(),
    instagram: Joi.boolean().required(),
    audienceNetwork: Joi.boolean().required()
  }).required(),
  specialAdCategories: Joi.array().items(Joi.string()).optional(),
  optimizationGoal: Joi.string().valid('LINK_CLICKS', 'CONVERSIONS', 'REACH', 'BRAND_AWARENESS', 'VIDEO_VIEWS').optional(),
  billingEvent: Joi.string().valid('IMPRESSIONS', 'LINK_CLICKS').optional()
});

// Bulk Ad Creation Schema
export const bulkAdSchema = Joi.object({
  templateId: Joi.string().required().messages({
    'string.empty': 'Template ID is required',
    'any.required': 'Template ID is required'
  }),
  media: Joi.array().items(Joi.string()).min(1).max(20).required().messages({
    'array.min': 'At least one media file is required',
    'array.max': 'Maximum 20 media files allowed',
    'any.required': 'Media files are required'
  }),
  campaignName: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Campaign name is required',
    'string.min': 'Campaign name must be at least 1 character',
    'string.max': 'Campaign name must be less than 100 characters',
    'any.required': 'Campaign name is required'
  }),
  adSetName: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Ad Set name is required',
    'string.min': 'Ad Set name must be at least 1 character',
    'string.max': 'Ad Set name must be less than 100 characters',
    'any.required': 'Ad Set name is required'
  }),
  options: Joi.object({
    createCampaign: Joi.boolean().required(),
    createAdSet: Joi.boolean().required(),
    status: Joi.string().valid('ACTIVE', 'PAUSED').required().messages({
      'any.only': 'Status must be ACTIVE or PAUSED',
      'any.required': 'Status is required'
    }),
    campaignBudget: Joi.number().min(1).optional(),
    adSetBudget: Joi.number().min(1).optional()
  }).required()
});

// Validation middleware factory
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Validation failed', {
        path: req.path,
        errors: validationErrors,
        body: req.body
      });

      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        data: validationErrors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Replace request body with validated data
    req.body = value;
    next();
  };
};

// Specific validation middlewares
export const validateAuthRequest = validateRequest(facebookAuthSchema);
export const validateTemplateRequest = validateRequest(templateSchema);
export const validateBulkAdRequest = validateRequest(bulkAdSchema);

// Query parameter validation
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    search: Joi.string().max(100).optional()
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Invalid query parameters',
      data: error.details,
      timestamp: new Date().toISOString()
    });
    return;
  }

  req.query = value;
  next();
}; 