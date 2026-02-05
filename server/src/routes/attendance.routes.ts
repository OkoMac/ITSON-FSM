import { Router } from 'express';
import {
  getAllAttendance,
  getAttendanceRecord,
  checkIn,
  checkOut,
  getMyAttendance,
  getTodayStatus,
  updateAttendanceStatus,
  getAttendanceStats,
} from '../controllers/attendance.controller';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(protect);

// Check-in/out
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);

// My attendance
router.get('/my-attendance', getMyAttendance);
router.get('/today-status', getTodayStatus);

// Stats
router.get('/stats', getAttendanceStats);

// Admin routes
router
  .route('/')
  .get(restrictTo('supervisor', 'project-manager', 'property-point', 'system-admin'), getAllAttendance);

router
  .route('/:id')
  .get(restrictTo('supervisor', 'project-manager', 'property-point', 'system-admin'), getAttendanceRecord)
  .patch(restrictTo('supervisor', 'project-manager', 'property-point', 'system-admin'), updateAttendanceStatus);

export default router;
