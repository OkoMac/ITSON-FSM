import { Router } from 'express';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

// Placeholder routes - implement controllers later
router.get('/', (req, res) => res.json({ message: 'Get all tasks' }));
router.get('/:id', (req, res) => res.json({ message: 'Get task by ID' }));
router.post('/', (req, res) => res.json({ message: 'Create task' }));
router.patch('/:id', (req, res) => res.json({ message: 'Update task' }));
router.delete('/:id', (req, res) => res.json({ message: 'Delete task' }));

export default router;
