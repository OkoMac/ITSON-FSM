import React from 'react';
import { GlassCard } from '@/components/ui';

const AdminPage: React.FC = () => {
  return (
    <div className="space-y-32 animate-fade-in">
      <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
      <GlassCard>
        <p className="text-text-secondary">Admin features coming soon...</p>
      </GlassCard>
    </div>
  );
};

export default AdminPage;
