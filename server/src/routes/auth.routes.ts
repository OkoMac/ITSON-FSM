import { Router } from 'express';
import {
  register,
  login,
  getMe,
  changePassword,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', authLimiter, login);

// Protected routes
router.use(protect); // All routes after this are protected

router.get('/me', getMe);
router.patch('/change-password', changePassword);

export default router;
