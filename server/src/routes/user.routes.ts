import { Router } from 'express';
import {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  restoreUser,
  updateUserRole,
} from '../controllers/user.controller';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(protect);

// User CRUD operations
router
  .route('/')
  .get(restrictTo('system-admin', 'project-manager', 'property-point'), getAllUsers)
  .post(restrictTo('system-admin', 'project-manager'), createUser);

router
  .route('/:id')
  .get(getUser) // Can view self or admin can view anyone
  .patch(updateUser) // Can update self or admin can update anyone
  .delete(restrictTo('system-admin', 'project-manager'), deleteUser);

// Admin-only operations
router.patch('/:id/restore', restrictTo('system-admin'), restoreUser);
router.patch('/:id/role', restrictTo('system-admin'), updateUserRole);

export default router;
