import { Router } from 'express';
import {
  syncParticipant,
  bulkSyncParticipants,
  getSyncHistory,
  getSyncStatus,
  retrySyncRecord,
  configureSyncSettings,
  getSyncConfiguration,
} from '../controllers/sync.controller';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(protect);

// Sync operations (Admin, Project Manager, Property Point)
router.post(
  '/participants/:participantId',
  restrictTo('system-admin', 'project-manager', 'property-point'),
  syncParticipant
);

router.post(
  '/participants/bulk',
  restrictTo('system-admin', 'project-manager', 'property-point'),
  bulkSyncParticipants
);

// Sync history and status
router.get(
  '/history',
  restrictTo('system-admin', 'project-manager', 'property-point'),
  getSyncHistory
);

router.get(
  '/status/:recordId',
  restrictTo('system-admin', 'project-manager', 'property-point', 'supervisor'),
  getSyncStatus
);

// Retry failed syncs
router.post(
  '/:syncId/retry',
  restrictTo('system-admin', 'project-manager'),
  retrySyncRecord
);

// Configuration (Admin only)
router.post(
  '/configure',
  restrictTo('system-admin'),
  configureSyncSettings
);

router.get(
  '/configure/:targetSystem',
  restrictTo('system-admin', 'project-manager'),
  getSyncConfiguration
);

export default router;
