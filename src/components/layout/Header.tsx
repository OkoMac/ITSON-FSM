import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { Badge } from '@/components/ui';
import { NotificationBell } from '@/components/notifications';

export const Header: React.FC = () => {
  const { user } = useAuthStore();
  const { pendingSyncCount } = useAppStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="sticky top-0 z-30 glass-card border-b border-white/10 lg:hidden">
      <div className="flex items-center justify-between p-16">
        <div>
          <h1 className="text-xl font-bold text-gradient">ITSON FSM</h1>
          {user && (
            <p className="text-sm text-text-secondary">
              {getGreeting()}, {user.name.split(' ')[0]}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-12">
          <NotificationBell />

          {pendingSyncCount > 0 && (
            <Badge variant="warning" icon={
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            }>
              {pendingSyncCount} pending
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
};
