import { Router } from 'express';
import { validateTemplateRequest } from '../middleware/validation';
import { validatePagination } from '../middleware/validation';
import { 
  createTemplate, 
  getTemplates, 
  getTemplate, 
  updateTemplate, 
  deleteTemplate 
} from '../controllers/templateController';

const router = Router();

// POST /api/templates - Create new template
router.post('/', validateTemplateRequest, createTemplate);

// GET /api/templates - Get all templates with pagination
router.get('/', validatePagination, getTemplates);

// GET /api/templates/:id - Get specific template
router.get('/:id', getTemplate);

// PUT /api/templates/:id - Update template
router.put('/:id', validateTemplateRequest, updateTemplate);

// DELETE /api/templates/:id - Delete template
router.delete('/:id', deleteTemplate);

export default router; 