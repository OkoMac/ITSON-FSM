/**
 * Notification Panel Component
 *
 * Dropdown panel showing recent notifications
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationItem } from './NotificationItem';
import { dbUtils, db } from '@/utils/db';
import { useAuthStore } from '@/store/useAuthStore';
import type { Notification } from '@/types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  anchorEl,
}) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadNotifications();
    }
  }, [isOpen, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        anchorEl &&
        !anchorEl.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, anchorEl]);

  const loadNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const allNotifications = await db.notifications
        .where('userId')
        .equals(user.id)
        .reverse()
        .sortBy('createdAt');

      setNotifications(allNotifications.slice(0, 10)); // Show latest 10
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

  const handleViewAll = () => {
    navigate('/notifications');
    onClose();
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-8 w-[400px] max-w-[calc(100vw-32px)] glass-card rounded-glass border border-border shadow-xl z-50"
      style={{
        top: anchorEl ? anchorEl.getBoundingClientRect().bottom : '100%',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-16 border-b border-border">
        <h3 className="text-lg font-semibold text-text-primary">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs text-accent-blue hover:text-accent-blue-light transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="p-32 text-center">
            <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-accent-blue"></div>
            <p className="text-text-secondary mt-8 text-sm">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-32 text-center">
            <svg
              className="w-48 h-48 mx-auto text-text-secondary opacity-50 mb-16"
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
            <p className="text-text-secondary text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="p-8 space-y-8">
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

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-12 border-t border-border text-center">
          <button
            onClick={handleViewAll}
            className="text-sm text-accent-blue hover:text-accent-blue-light transition-colors font-medium"
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
};
