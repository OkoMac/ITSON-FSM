import { Router } from 'express';
import { protect } from '../middleware/auth';

const router = Router();
router.use(protect);

router.get('/', (req, res) => res.json({ message: 'Get all participants' }));
router.get('/:id', (req, res) => res.json({ message: 'Get participant by ID' }));

export default router;
