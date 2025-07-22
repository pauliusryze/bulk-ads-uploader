"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthStatus = exports.validateFacebookCredentials = void 0;
const facebookService_1 = require("../services/facebookService");
const logger_1 = require("../utils/logger");
const validateFacebookCredentials = async (req, res) => {
    try {
        const credentials = req.body;
        logger_1.logger.info('Validating Facebook credentials', {
            adAccountId: credentials.adAccountId
        });
        const facebookService = facebookService_1.FacebookService.getInstance();
        const result = await facebookService.validateCredentials(credentials);
        if (result.isValid) {
            res.status(200).json({
                success: true,
                data: {
                    isValid: true,
                    adAccount: result.adAccount,
                    permissions: result.permissions
                },
                message: 'Facebook credentials validated successfully',
                timestamp: new Date().toISOString()
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: 'FACEBOOK_API_ERROR',
                message: 'Invalid Facebook credentials. Please check your App ID, App Secret, Access Token, and Ad Account ID.',
                timestamp: new Date().toISOString()
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Facebook credentials validation error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        res.status(500).json({
            success: false,
            error: 'FACEBOOK_API_ERROR',
            message: 'Failed to validate Facebook credentials. Please try again.',
            timestamp: new Date().toISOString()
        });
    }
};
exports.validateFacebookCredentials = validateFacebookCredentials;
const getAuthStatus = async (req, res) => {
    try {
        const facebookService = facebookService_1.FacebookService.getInstance();
        const isInitialized = facebookService.isInitialized();
        const config = facebookService.getConfig();
        res.status(200).json({
            success: true,
            data: {
                isInitialized,
                hasAccessToken: !!config.accessToken,
                hasAdAccountId: !!config.adAccountId
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get auth status', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get authentication status',
            timestamp: new Date().toISOString()
        });
    }
};
exports.getAuthStatus = getAuthStatus;
//# sourceMappingURL=authController.js.map