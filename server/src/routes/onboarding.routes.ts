import { Router, Request } from 'express';
import {
  getAllowedContacts,
  createAllowedContact,
  bulkCreateAllowedContacts,
  sendInvite,
  broadcastInvites,
  getInviteByCode,
  completeInvite,
  updateAllowedContact,
  deleteAllowedContact,
} from '../controllers/onboarding.controller';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// Public routes (no authentication required)
router.get('/invite/:code', getInviteByCode as any);
router.post('/invite/:code/complete', completeInvite as any);

// Protected routes (authentication required)
router.use(protect);

// Allowed contacts management
router
  .route('/contacts')
  .get(
    restrictTo('system-admin', 'project-manager', 'supervisor', 'property-point'),
    getAllowedContacts
  )
  .post(
    restrictTo('system-admin', 'project-manager', 'supervisor'),
    createAllowedContact
  );

// Bulk import
router.post(
  '/contacts/bulk',
  restrictTo('system-admin', 'project-manager', 'supervisor'),
  bulkCreateAllowedContacts
);

// Broadcast invites
router.post(
  '/invites/broadcast',
  restrictTo('system-admin', 'project-manager'),
  broadcastInvites
);

// Individual contact operations
router
  .route('/contacts/:id')
  .patch(
    restrictTo('system-admin', 'project-manager', 'supervisor'),
    updateAllowedContact
  )
  .delete(
    restrictTo('system-admin', 'project-manager'),
    deleteAllowedContact
  );

// Send individual invite
router.post(
  '/contacts/:id/send',
  restrictTo('system-admin', 'project-manager', 'supervisor'),
  sendInvite
);

export default router;
