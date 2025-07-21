import { Router } from 'express';
import { upload } from '../middleware/upload';
import { uploadImages, getImages, deleteImage } from '../controllers/imageController';

const router = Router();

// POST /api/images/upload - Upload multiple images
router.post('/upload', upload.array('images', 10), uploadImages);

// GET /api/images - Get all uploaded images
router.get('/', getImages);

// DELETE /api/images/:id - Delete a specific image
router.delete('/:id', deleteImage);

export default router; 