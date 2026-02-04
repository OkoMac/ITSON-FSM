import { Router } from 'express';
import { protect } from '../middleware/auth';

const router = Router();
router.use(protect);

router.get('/', (req, res) => res.json({ message: 'Get all users' }));
router.get('/:id', (req, res) => res.json({ message: 'Get user by ID' }));

export default router;
