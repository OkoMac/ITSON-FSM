import { Router } from 'express';
import {
  generateAttendanceReport,
  generateParticipantsReport,
  generateTasksReport,
  generateComplianceReport,
  generateMEReport,
  exportReport,
} from '../controllers/reports.controller';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(protect);

// Report generation
router.get(
  '/attendance',
  restrictTo('system-admin', 'project-manager', 'property-point', 'supervisor'),
  generateAttendanceReport
);

router.get(
  '/participants',
  restrictTo('system-admin', 'project-manager', 'property-point'),
  generateParticipantsReport
);

router.get(
  '/tasks',
  restrictTo('system-admin', 'project-manager', 'property-point', 'supervisor'),
  generateTasksReport
);

router.get(
  '/compliance',
  restrictTo('system-admin', 'project-manager', 'property-point'),
  generateComplianceReport
);

router.get(
  '/me',
  restrictTo('system-admin', 'project-manager', 'property-point'),
  generateMEReport
);

// Export functionality
router.get(
  '/export',
  restrictTo('system-admin', 'project-manager', 'property-point'),
  exportReport
);

export default router;
