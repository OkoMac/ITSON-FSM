import { Router } from 'express';
import {
  verifyWebhook,
  processWebhook,
  getSessions,
  getSession,
  sendManualMessage,
} from '../controllers/whatsapp.controller';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// Webhook verification (GET) - No auth required for WhatsApp verification
router.get('/webhook', verifyWebhook);

// Webhook processing (POST) - No auth required for WhatsApp messages
router.post('/webhook', processWebhook);

// Admin routes - Protected
router.use(protect); // All routes below require authentication

// Get all sessions (admin/supervisor only)
router.get('/sessions', restrictTo('system-admin', 'idc-admin', 'project-manager', 'supervisor'), getSessions);

// Get session details
router.get('/sessions/:id', restrictTo('system-admin', 'idc-admin', 'project-manager', 'supervisor'), getSession);

// Send manual message (admin only)
router.post('/send', restrictTo('system-admin', 'idc-admin'), sendManualMessage);

export default router;
