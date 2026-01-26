/**
 * Notifications Page
 *
 * View and manage all notifications
 */

import React, { useState, useEffect } from 'react';
import { GlassCard, Button } from '@/components/ui';
import { NotificationItem } from '@/components/notifications';
import { dbUtils, db } from '@/utils/db';
import { requestNotificationPermission, areNotificationsEnabled } from '@/services/notifications';
import { useAuthStore } from '@/store/useAuthStore';
import type { Notification } from '@/types';

const NotificationsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    loadNotifications();
    checkNotificationPermission();
  }, [user, filter]);

  const checkNotificationPermission = () => {
    setNotificationsEnabled(areNotificationsEnabled());
  };

  const loadNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      let allNotifications: Notification[];

      if (filter === 'unread') {
        allNotifications = await dbUtils.getUnreadNotifications(user.id);
      } else {
        allNotifications = await db.notifications
          .where('userId')
          .equals(user.id)
          .reverse()
          .sortBy('createdAt');
      }

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await dbUtils.markNotificationAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await dbUtils.markAllNotificationsAsRead(user.id);
    loadNotifications();
  };

  const handleDelete = async (id: string) => {
    await db.notifications.delete(id);
    loadNotifications();
  };

  const handleClearAll = async () => {
    if (!user) return;

    const confirmed = confirm(
      'Are you sure you want to delete all notifications? This action cannot be undone.'
    );

    if (confirmed) {
      await db.notifications.where('userId').equals(user.id).delete();
      loadNotifications();
    }
  };

  const handleEnableNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotificationsEnabled(permission === 'granted');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="page-container">
      <div className="content-wrapper">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-16 mb-32">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-8">Notifications</h1>
            <p className="text-text-secondary">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-8">
            {unreadCount > 0 && (
              <Button variant="secondary" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="secondary" onClick={handleClearAll}>
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Push Notification Permission */}
        {!notificationsEnabled && (
          <GlassCard className="mb-24">
            <div className="flex items-start space-x-16">
              <div className="p-12 rounded-glass bg-warning/10 text-warning flex-shrink-0">
                <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary mb-8">
                  Enable Push Notifications
                </h3>
                <p className="text-sm text-text-secondary mb-16">
                  Stay updated with real-time notifications about tasks, attendance, and important
                  updates even when you're not using the app.
                </p>
                <Button variant="primary" onClick={handleEnableNotifications}>
                  Enable Notifications
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Filter Tabs */}
        <div className="flex space-x-8 border-b border-border mb-24">
          <button
            onClick={() => setFilter('all')}
            className={`px-20 py-12 font-medium text-sm transition-colors border-b-2 ${
              filter === 'all'
                ? 'text-accent-blue border-accent-blue'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-20 py-12 font-medium text-sm transition-colors border-b-2 ${
              filter === 'unread'
                ? 'text-accent-blue border-accent-blue'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="text-center py-48">
            <div className="inline-block animate-spin rounded-full h-48 w-48 border-b-2 border-accent-blue"></div>
            <p className="text-text-secondary mt-16">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <GlassCard>
            <div className="text-center py-48">
              <svg
                className="w-64 h-64 mx-auto text-text-secondary opacity-50 mb-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <p className="text-text-secondary text-lg">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-text-secondary text-sm mt-8">
                {filter === 'unread'
                  ? 'All caught up! Check back later for updates.'
                  : "You'll see notifications here when there are updates."}
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-12">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
