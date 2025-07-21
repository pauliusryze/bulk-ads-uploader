import { Router } from 'express';
import { validateBulkAdRequest } from '../middleware/validation';
import { 
  createBulkAds, 
  getJobStatus, 
  getAllJobs, 
  deleteJob 
} from '../controllers/adController';

const router = Router();

// POST /api/ads/bulk - Create bulk ads
router.post('/bulk', validateBulkAdRequest, createBulkAds);

// GET /api/ads/jobs - Get all jobs
router.get('/jobs', getAllJobs);

// GET /api/ads/jobs/:jobId - Get job status
router.get('/jobs/:jobId', getJobStatus);

// DELETE /api/ads/jobs/:jobId - Delete job
router.delete('/jobs/:jobId', deleteJob);

export default router; 