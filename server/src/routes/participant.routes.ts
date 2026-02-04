import { Router } from 'express';
import {
  getAllParticipants,
  getParticipant,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  getMyProfile,
  enrollBiometric,
  uploadDocument,
  getParticipantStats,
} from '../controllers/participant.controller';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(protect);

// My profile
router.get('/my-profile', getMyProfile);

// Stats
router.get('/stats', restrictTo('supervisor', 'project-manager', 'property-point', 'system-admin'), getParticipantStats);

// Biometric enrollment
router.post('/:id/enroll-biometric', enrollBiometric);

// Document upload
router.post('/:id/upload-document', uploadDocument);

// CRUD operations
router
  .route('/')
  .get(restrictTo('supervisor', 'project-manager', 'property-point', 'system-admin'), getAllParticipants)
  .post(restrictTo('supervisor', 'project-manager', 'property-point', 'system-admin'), createParticipant);

router
  .route('/:id')
  .get(getParticipant)
  .patch(updateParticipant)
  .delete(restrictTo('project-manager', 'system-admin'), deleteParticipant);

export default router;
