"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePagination = exports.validateBulkAdRequest = exports.validateTemplateRequest = exports.validateAuthRequest = exports.validateRequest = exports.bulkAdSchema = exports.templateSchema = exports.facebookAuthSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const logger_1 = require("../utils/logger");
exports.facebookAuthSchema = joi_1.default.object({
    appId: joi_1.default.string().required().messages({
        'string.empty': 'App ID is required',
        'any.required': 'App ID is required'
    }),
    appSecret: joi_1.default.string().required().messages({
        'string.empty': 'App Secret is required',
        'any.required': 'App Secret is required'
    }),
    accessToken: joi_1.default.string().required().messages({
        'string.empty': 'Access Token is required',
        'any.required': 'Access Token is required'
    }),
    adAccountId: joi_1.default.string().pattern(/^act_\d+$/).required().messages({
        'string.pattern.base': 'Ad Account ID must be in format: act_123456789',
        'any.required': 'Ad Account ID is required'
    })
});
exports.templateSchema = joi_1.default.object({
    name: joi_1.default.string().min(1).max(100).required().messages({
        'string.empty': 'Template name is required',
        'string.min': 'Template name must be at least 1 character',
        'string.max': 'Template name must be less than 100 characters',
        'any.required': 'Template name is required'
    }),
    adDescription: joi_1.default.string().max(500).optional().messages({
        'string.max': 'Description must be less than 500 characters'
    }),
    adCopy: joi_1.default.object({
        headline: joi_1.default.string().min(1).max(40).required().messages({
            'string.empty': 'Headline is required',
            'string.min': 'Headline must be at least 1 character',
            'string.max': 'Headline must be less than 40 characters',
            'any.required': 'Headline is required'
        }),
        primaryText: joi_1.default.string().min(1).max(125).required().messages({
            'string.empty': 'Primary text is required',
            'string.min': 'Primary text must be at least 1 character',
            'string.max': 'Primary text must be less than 125 characters',
            'any.required': 'Primary text is required'
        }),
        callToAction: joi_1.default.string().valid('SHOP_NOW', 'LEARN_MORE', 'SIGN_UP', 'BOOK_NOW', 'CONTACT_US').optional(),
        description: joi_1.default.string().max(125).optional().messages({
            'string.max': 'Description must be less than 125 characters'
        })
    }).required(),
    targeting: joi_1.default.object({
        ageMin: joi_1.default.number().min(13).max(65).optional().messages({
            'number.min': 'Minimum age must be at least 13',
            'number.max': 'Maximum age must be 65 or less'
        }),
        ageMax: joi_1.default.number().min(13).max(65).optional().messages({
            'number.min': 'Maximum age must be at least 13',
            'number.max': 'Maximum age must be 65 or less'
        }),
        locations: joi_1.default.object({
            inclusion: joi_1.default.array().items(joi_1.default.string()).optional(),
            exclusion: joi_1.default.array().items(joi_1.default.string()).optional()
        }).optional(),
        interests: joi_1.default.array().items(joi_1.default.string()).optional(),
        customAudienceExclusion: joi_1.default.array().items(joi_1.default.string()).optional(),
        languages: joi_1.default.array().items(joi_1.default.string()).optional()
    }).required(),
    delivery: joi_1.default.object({
        accelerated: joi_1.default.boolean().optional(),
        costPerResult: joi_1.default.number().optional(),
        costPerResultCurrency: joi_1.default.string().valid('USD', 'EUR', 'GBP', 'CAD').optional()
    }).optional(),
    conversion: joi_1.default.object({
        conversionEvent: joi_1.default.any().optional(),
        dataset: joi_1.default.any().optional()
    }).optional(),
    placement: joi_1.default.object({
        facebook: joi_1.default.boolean().required(),
        instagram: joi_1.default.boolean().required(),
        audienceNetwork: joi_1.default.boolean().required()
    }).required(),
    specialAdCategories: joi_1.default.array().items(joi_1.default.string()).optional(),
    optimizationGoal: joi_1.default.string().valid('LINK_CLICKS', 'CONVERSIONS', 'REACH', 'BRAND_AWARENESS', 'VIDEO_VIEWS').optional(),
    billingEvent: joi_1.default.string().valid('IMPRESSIONS', 'LINK_CLICKS').optional()
});
exports.bulkAdSchema = joi_1.default.object({
    templateId: joi_1.default.string().required().messages({
        'string.empty': 'Template ID is required',
        'any.required': 'Template ID is required'
    }),
    media: joi_1.default.array().items(joi_1.default.string()).min(1).max(20).required().messages({
        'array.min': 'At least one media file is required',
        'array.max': 'Maximum 20 media files allowed',
        'any.required': 'Media files are required'
    }),
    campaignName: joi_1.default.string().min(1).max(100).required().messages({
        'string.empty': 'Campaign name is required',
        'string.min': 'Campaign name must be at least 1 character',
        'string.max': 'Campaign name must be less than 100 characters',
        'any.required': 'Campaign name is required'
    }),
    adSetName: joi_1.default.string().min(1).max(100).required().messages({
        'string.empty': 'Ad Set name is required',
        'string.min': 'Ad Set name must be at least 1 character',
        'string.max': 'Ad Set name must be less than 100 characters',
        'any.required': 'Ad Set name is required'
    }),
    options: joi_1.default.object({
        createCampaign: joi_1.default.boolean().required(),
        createAdSet: joi_1.default.boolean().required(),
        status: joi_1.default.string().valid('ACTIVE', 'PAUSED').required().messages({
            'any.only': 'Status must be ACTIVE or PAUSED',
            'any.required': 'Status is required'
        }),
        campaignBudget: joi_1.default.number().min(1).optional(),
        adSetBudget: joi_1.default.number().min(1).optional()
    }).required()
});
const validateRequest = (schema) => {
    return (req, res, next) => {
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
            logger_1.logger.warn('Validation failed', {
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
        req.body = value;
        next();
    };
};
exports.validateRequest = validateRequest;
exports.validateAuthRequest = (0, exports.validateRequest)(exports.facebookAuthSchema);
exports.validateTemplateRequest = (0, exports.validateRequest)(exports.templateSchema);
exports.validateBulkAdRequest = (0, exports.validateRequest)(exports.bulkAdSchema);
const validatePagination = (req, res, next) => {
    const schema = joi_1.default.object({
        page: joi_1.default.number().min(1).default(1),
        limit: joi_1.default.number().min(1).max(100).default(10),
        search: joi_1.default.string().max(100).optional()
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
exports.validatePagination = validatePagination;
//# sourceMappingURL=validation.js.map