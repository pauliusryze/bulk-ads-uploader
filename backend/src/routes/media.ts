import { Router } from 'express';
import multer from 'multer';
import { uploadMedia, getMedia, deleteMedia } from '../controllers/mediaController';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  },
});

// POST /api/media/upload - Upload multiple media files
router.post('/upload', upload.array('media', 20), uploadMedia);

// GET /api/media - Get all uploaded media
router.get('/', getMedia);

// DELETE /api/media/:id - Delete a specific media file
router.delete('/:id', deleteMedia);

export default router; 