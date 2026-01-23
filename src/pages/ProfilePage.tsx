import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { GlassCard, Button, Avatar } from '@/components/ui';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuthStore();

  if (!user) return null;

  return (
    <div className="space-y-32 animate-fade-in">
      <h1 className="text-3xl font-bold text-text-primary">Profile</h1>

      <GlassCard>
        <div className="flex items-center gap-24 mb-32">
          <Avatar size="xl" fallback={user.name} />
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">{user.name}</h2>
            <p className="text-text-secondary capitalize">{user.role.replace('-', ' ')}</p>
          </div>
        </div>

        <div className="space-y-16">
          <div>
            <p className="text-sm text-text-tertiary mb-4">Email</p>
            <p className="text-base text-text-primary">{user.email}</p>
          </div>
          {user.phoneNumber && (
            <div>
              <p className="text-sm text-text-tertiary mb-4">Phone</p>
              <p className="text-base text-text-primary">{user.phoneNumber}</p>
            </div>
          )}
        </div>

        <div className="mt-32 pt-24 border-t border-white/10">
          <Button variant="secondary" onClick={logout}>
            Sign Out
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};

export default ProfilePage;
