import { Router } from 'express';
import {
  getDashboardAnalytics,
  getAttendanceTrends,
  getTaskTrends,
  getParticipantGrowth,
  getSitePerformance,
  getTopPerformers,
} from '../controllers/analytics.controller';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(protect);

// Dashboard analytics
router.get(
  '/dashboard',
  restrictTo('system-admin', 'project-manager', 'property-point', 'supervisor'),
  getDashboardAnalytics
);

// Trends
router.get(
  '/trends/attendance',
  restrictTo('system-admin', 'project-manager', 'property-point', 'supervisor'),
  getAttendanceTrends
);

router.get(
  '/trends/tasks',
  restrictTo('system-admin', 'project-manager', 'property-point', 'supervisor'),
  getTaskTrends
);

router.get(
  '/trends/participants',
  restrictTo('system-admin', 'project-manager', 'property-point'),
  getParticipantGrowth
);

// Performance metrics
router.get(
  '/performance/sites',
  restrictTo('system-admin', 'project-manager', 'property-point'),
  getSitePerformance
);

router.get(
  '/performance/top-performers',
  restrictTo('system-admin', 'project-manager', 'property-point', 'supervisor'),
  getTopPerformers
);

export default router;
