import { Request, Response } from 'express';
import { FacebookService } from '../services/facebookService';
import { logger } from '../utils/logger';
import { FacebookCredentials } from '../types';

/**
 * Validate Facebook API credentials
 * POST /api/auth/facebook
 */
export const validateFacebookCredentials = async (req: Request, res: Response): Promise<void> => {
  try {
    const credentials: FacebookCredentials = req.body;
    
    logger.info('Validating Facebook credentials', {
      adAccountId: credentials.adAccountId
    });

    const facebookService = FacebookService.getInstance();
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
    } else {
      res.status(400).json({
        success: false,
        error: 'FACEBOOK_API_ERROR',
        message: 'Invalid Facebook credentials. Please check your App ID, App Secret, Access Token, and Ad Account ID.',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    logger.error('Facebook credentials validation error', {
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

/**
 * Get current Facebook API status
 * GET /api/auth/status
 */
export const getAuthStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const facebookService = FacebookService.getInstance();
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

  } catch (error) {
    logger.error('Failed to get auth status', {
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