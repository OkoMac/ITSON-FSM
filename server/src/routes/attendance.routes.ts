import { Router } from 'express';
import { protect } from '../middleware/auth';

const router = Router();
router.use(protect);

router.get('/', (req, res) => res.json({ message: 'Get attendance records' }));
router.post('/check-in', (req, res) => res.json({ message: 'Check in' }));
router.post('/check-out', (req, res) => res.json({ message: 'Check out' }));

export default router;
