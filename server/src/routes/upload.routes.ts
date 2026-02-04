import { Router } from 'express';
import { uploadFile, uploadMultipleFiles } from '../controllers/upload.controller';
import { protect } from '../middleware/auth';
import { uploadSingle, uploadMultiple } from '../middleware/upload';

const router = Router();

// All routes are protected
router.use(protect);

// Single file upload
router.post('/single', uploadSingle, uploadFile);

// Multiple files upload
router.post('/multiple', uploadMultiple, uploadMultipleFiles);

export default router;
