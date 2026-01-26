/**
 * Notification Item Component
 *
 * Displays a single notification with icon, title, message, and timestamp
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import type { Notification } from '@/types';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
}) => {
  const navigate = useNavigate();

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'task-assigned':
      case 'task-completed':
        return (
          <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        );
      case 'attendance-reminder':
        return (
          <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'document-approved':
      case 'document-rejected':
        return (
          <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case 'story-approved':
      case 'story-published':
        return (
          <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        );
      case 'sync-completed':
      case 'sync-failed':
        return (
          <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        );
      case 'system-announcement':
      default:
        return (
          <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'task-assigned':
      case 'task-completed':
        return 'text-accent-blue bg-accent-blue/10';
      case 'attendance-reminder':
        return 'text-warning bg-warning/10';
      case 'document-approved':
      case 'story-approved':
      case 'story-published':
      case 'sync-completed':
        return 'text-success bg-success/10';
      case 'document-rejected':
      case 'sync-failed':
        return 'text-error bg-error/10';
      case 'system-announcement':
      default:
        return 'text-purple-400 bg-purple-400/10';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'p-16 rounded-glass border transition-all duration-200',
        notification.read
          ? 'bg-surface-secondary/30 border-border hover:bg-surface-secondary/50'
          : 'bg-accent-blue/5 border-accent-blue/20 hover:bg-accent-blue/10',
        notification.actionUrl && 'cursor-pointer'
      )}
    >
      <div className="flex items-start space-x-12">
        {/* Icon */}
        <div className={cn('p-8 rounded-glass flex-shrink-0', getNotificationColor())}>
          {getNotificationIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-4">
            <h4 className="text-sm font-semibold text-text-primary truncate">
              {notification.title}
            </h4>
            {!notification.read && (
              <div className="w-8 h-8 rounded-full bg-accent-blue flex-shrink-0 ml-8"></div>
            )}
          </div>

          <p className="text-sm text-text-secondary mb-8 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              {formatTimestamp(notification.createdAt)}
            </span>

            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                className="text-text-secondary hover:text-error transition-colors p-4"
                title="Delete notification"
              >
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
