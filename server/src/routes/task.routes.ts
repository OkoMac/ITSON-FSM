import { Router } from 'express';
import {
  getAllTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  approveTask,
  rejectTask,
  getMyTasks,
} from '../controllers/task.controller';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(protect);

// Get my tasks (worker-specific)
router.get('/my-tasks', getMyTasks);

// Approve/reject tasks (supervisors only)
router.patch('/:id/approve', restrictTo('supervisor', 'project-manager', 'system-admin'), approveTask);
router.patch('/:id/reject', restrictTo('supervisor', 'project-manager', 'system-admin'), rejectTask);

// CRUD operations
router
  .route('/')
  .get(getAllTasks)
  .post(restrictTo('supervisor', 'project-manager', 'system-admin'), createTask);

router
  .route('/:id')
  .get(getTask)
  .patch(updateTask)
  .delete(restrictTo('supervisor', 'project-manager', 'system-admin'), deleteTask);

export default router;
