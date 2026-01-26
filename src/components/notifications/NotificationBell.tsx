/**
 * Notification Bell Component
 *
 * Bell icon with badge showing unread count
 */

import React, { useState, useEffect, useRef } from 'react';
import { NotificationPanel } from './NotificationPanel';
import { getUnreadCount } from '@/services/notifications';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/utils/cn';

export const NotificationBell: React.FC = () => {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (user) {
      loadUnreadCount();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;

    try {
      const count = await getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleTogglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    loadUnreadCount(); // Refresh count when panel closes
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleTogglePanel}
        className={cn(
          'relative p-8 rounded-glass glass-button transition-all duration-200',
          'hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-blue',
          isPanelOpen && 'bg-white/10'
        )}
        aria-label="Notifications"
      >
        <svg
          className="w-24 h-24 text-text-primary"
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

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[20px] h-20 px-6 rounded-full bg-error text-white text-xs font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        anchorEl={buttonRef.current}
      />
    </div>
  );
};
