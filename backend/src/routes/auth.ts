import { Router } from 'express';
import { validateAuthRequest } from '../middleware/validation';
import { validateFacebookCredentials, getAuthStatus } from '../controllers/authController';

const router = Router();

// POST /api/auth/validate - Validate Facebook credentials
router.post('/validate', validateAuthRequest, validateFacebookCredentials);

// GET /api/auth/status - Get authentication status
router.get('/status', getAuthStatus);

export default router; 