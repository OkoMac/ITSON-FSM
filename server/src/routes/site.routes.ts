import { Router } from 'express';
import {
  getAllSites,
  getSite,
  createSite,
  updateSite,
  deleteSite,
} from '../controllers/site.controller';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(protect);

router
  .route('/')
  .get(getAllSites)
  .post(restrictTo('supervisor', 'project-manager', 'system-admin'), createSite);

router
  .route('/:id')
  .get(getSite)
  .patch(restrictTo('supervisor', 'project-manager', 'system-admin'), updateSite)
  .delete(restrictTo('project-manager', 'system-admin'), deleteSite);

export default router;
