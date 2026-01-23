import React from 'react';
import { GlassCard } from '@/components/ui';

const SitesPage: React.FC = () => {
  return (
    <div className="space-y-32 animate-fade-in">
      <h1 className="text-3xl font-bold text-text-primary">Sites</h1>
      <GlassCard>
        <p className="text-text-secondary">Site management coming soon...</p>
      </GlassCard>
    </div>
  );
};

export default SitesPage;
