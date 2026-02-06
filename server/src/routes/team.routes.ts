import { Router } from 'express';
import {
  getAllTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  getTeamMembers,
} from '../controllers/team.controller';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(protect);

// Team CRUD operations
router
  .route('/')
  .get(
    restrictTo('system-admin', 'project-manager', 'supervisor', 'property-point'),
    getAllTeams
  )
  .post(
    restrictTo('system-admin', 'project-manager', 'supervisor'),
    createTeam
  );

router
  .route('/:id')
  .get(getTeam) // Can view team details
  .patch(
    restrictTo('system-admin', 'project-manager', 'supervisor'),
    updateTeam
  )
  .delete(
    restrictTo('system-admin', 'project-manager'),
    deleteTeam
  );

// Team member management
router.get('/:id/members', getTeamMembers);

router.post(
  '/:id/members',
  restrictTo('system-admin', 'project-manager', 'supervisor'),
  addTeamMember
);

router.delete(
  '/:id/members/:userId',
  restrictTo('system-admin', 'project-manager', 'supervisor'),
  removeTeamMember
);

export default router;
