/**
 * Notification Service
 *
 * Manages in-app and push notifications
 */

import { db, dbUtils } from '@/utils/db';
import type { Notification } from '@/types';

export type NotificationType =
  | 'task-assigned'
  | 'task-completed'
  | 'attendance-reminder'
  | 'document-approved'
  | 'document-rejected'
  | 'story-approved'
  | 'story-published'
  | 'sync-completed'
  | 'sync-failed'
  | 'system-announcement';

export interface NotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  userId: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a new notification
 */
export async function createNotification(
  payload: NotificationPayload
): Promise<string> {
  const notification: Notification = {
    id: crypto.randomUUID(),
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    read: false,
    actionUrl: payload.actionUrl,
    metadata: payload.metadata,
    createdAt: new Date().toISOString(),
  };

  const notificationId = await dbUtils.addNotification(notification);

  // Send push notification if permission granted
  if (Notification.permission === 'granted') {
    await sendPushNotification(payload);
  }

  return notificationId;
}

/**
 * Send push notification via browser API
 */
async function sendPushNotification(payload: NotificationPayload): Promise<void> {
  try {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    // Show notification
    await registration.showNotification(payload.title, {
      body: payload.message,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      tag: payload.type,
      requireInteraction: false,
      data: {
        url: payload.actionUrl,
        metadata: payload.metadata,
      },
    });
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Send task assignment notification
 */
export async function notifyTaskAssigned(
  userId: string,
  taskTitle: string,
  taskId: string
): Promise<void> {
  await createNotification({
    title: 'New Task Assigned',
    message: `You have been assigned: ${taskTitle}`,
    type: 'task-assigned',
    userId,
    actionUrl: `/tasks`,
    metadata: { taskId },
  });
}

/**
 * Send task completion notification
 */
export async function notifyTaskCompleted(
  userId: string,
  taskTitle: string,
  completedBy: string
): Promise<void> {
  await createNotification({
    title: 'Task Completed',
    message: `${completedBy} completed: ${taskTitle}`,
    type: 'task-completed',
    userId,
    actionUrl: `/tasks`,
  });
}

/**
 * Send attendance reminder notification
 */
export async function notifyAttendanceReminder(userId: string): Promise<void> {
  const now = new Date();
  const hour = now.getHours();

  // Only send during work hours
  if (hour < 7 || hour > 18) return;

  await createNotification({
    title: 'Check-In Reminder',
    message: 'Don\'t forget to check in for today!',
    type: 'attendance-reminder',
    userId,
    actionUrl: '/check-in',
  });
}

/**
 * Send document approval notification
 */
export async function notifyDocumentApproved(
  userId: string,
  documentType: string
): Promise<void> {
  await createNotification({
    title: 'Document Approved',
    message: `Your ${documentType} has been approved`,
    type: 'document-approved',
    userId,
    actionUrl: '/onboarding',
  });
}

/**
 * Send document rejection notification
 */
export async function notifyDocumentRejected(
  userId: string,
  documentType: string,
  reason?: string
): Promise<void> {
  await createNotification({
    title: 'Document Rejected',
    message: `Your ${documentType} was rejected${reason ? `: ${reason}` : ''}`,
    type: 'document-rejected',
    userId,
    actionUrl: '/onboarding',
  });
}

/**
 * Send story approval notification
 */
export async function notifyStoryApproved(userId: string, storyTitle: string): Promise<void> {
  await createNotification({
    title: 'Story Approved',
    message: `Your story "${storyTitle}" has been approved!`,
    type: 'story-approved',
    userId,
    actionUrl: '/stories',
  });
}

/**
 * Send story published notification
 */
export async function notifyStoryPublished(userId: string, storyTitle: string): Promise<void> {
  await createNotification({
    title: 'Story Published',
    message: `Your story "${storyTitle}" is now live!`,
    type: 'story-published',
    userId,
    actionUrl: '/stories',
  });
}

/**
 * Send sync completion notification
 */
export async function notifySyncCompleted(
  userId: string,
  recordCount: number
): Promise<void> {
  await createNotification({
    title: 'Sync Completed',
    message: `Successfully synced ${recordCount} record${recordCount !== 1 ? 's' : ''} to Kwantu`,
    type: 'sync-completed',
    userId,
    actionUrl: '/admin',
  });
}

/**
 * Send sync failure notification
 */
export async function notifySyncFailed(userId: string, error: string): Promise<void> {
  await createNotification({
    title: 'Sync Failed',
    message: `Kwantu sync failed: ${error}`,
    type: 'sync-failed',
    userId,
    actionUrl: '/admin',
  });
}

/**
 * Send system announcement
 */
export async function notifySystemAnnouncement(
  userIds: string[],
  title: string,
  message: string
): Promise<void> {
  for (const userId of userIds) {
    await createNotification({
      title,
      message,
      type: 'system-announcement',
      userId,
    });
  }
}

/**
 * Schedule daily attendance reminders
 */
export function scheduleAttendanceReminders(): void {
  // Check every hour during work hours
  const checkInterval = 60 * 60 * 1000; // 1 hour

  setInterval(async () => {
    const now = new Date();
    const hour = now.getHours();

    // Send reminders at 8 AM
    if (hour === 8) {
      const participants = await db.participants
        .where('status')
        .equals('active')
        .toArray();

      for (const participant of participants) {
        await notifyAttendanceReminder(participant.userId);
      }
    }
  }, checkInterval);
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const unread = await dbUtils.getUnreadNotifications(userId);
  return unread.length;
}
