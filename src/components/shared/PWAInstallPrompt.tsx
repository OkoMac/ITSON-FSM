import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { GlassCard, Button } from '@/components/ui';

export const PWAInstallPrompt: React.FC = () => {
  const { showInstallPrompt, installPWA, setShowInstallPrompt } = useAppStore();

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-24 left-16 right-16 z-50 md:left-auto md:right-24 md:max-w-md animate-slide-up">
      <GlassCard>
        <div className="flex items-start gap-16">
          <div className="p-12 bg-accent-blue/20 rounded-glass">
            <svg className="w-6 h-6 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>

          <div className="flex-1">
            <h3 className="text-base font-semibold text-text-primary mb-4">
              Install ITSON FSM App
            </h3>
            <p className="text-sm text-text-secondary mb-16">
              Install this app on your device for quick access and offline support.
            </p>

            <div className="flex gap-12">
              <Button size="sm" onClick={installPWA}>
                Install
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowInstallPrompt(false)}
              >
                Not now
              </Button>
            </div>
          </div>

          <button
            onClick={() => setShowInstallPrompt(false)}
            className="p-4 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
