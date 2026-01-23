import React from 'react';
import { GlassCard } from '@/components/ui';

const OnboardingPage: React.FC = () => {
  return (
    <div className="space-y-32 animate-fade-in">
      <h1 className="text-3xl font-bold text-text-primary">Onboarding</h1>
      <GlassCard>
        <p className="text-text-secondary">Participant onboarding workflow coming soon...</p>
      </GlassCard>
    </div>
  );
};

export default OnboardingPage;
