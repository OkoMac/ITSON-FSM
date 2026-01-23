import React, { useState } from 'react';
import { GlassCard, Button, Badge } from '@/components/ui';

const CheckInPage: React.FC = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    setCheckInTime(new Date().toLocaleTimeString('en-ZA'));
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    setCheckInTime(null);
  };

  return (
    <div className="space-y-32 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-8">
          Biometric Check-In
        </h1>
        <p className="text-text-secondary">
          Use facial recognition or fingerprint to check in/out
        </p>
      </div>

      {/* Status card */}
      <GlassCard>
        <div className="text-center py-48">
          {isCheckedIn ? (
            <>
              <div className="w-24 h-24 mx-auto mb-24 bg-status-success/20 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <Badge variant="success" size="lg" className="mb-16">Checked In</Badge>
              <p className="text-2xl font-bold text-text-primary mb-8 font-sf-mono">
                {checkInTime}
              </p>
              <p className="text-sm text-text-secondary mb-32">
                Main Factory Site
              </p>
              <Button variant="secondary" onClick={handleCheckOut}>
                Check Out
              </Button>
            </>
          ) : (
            <>
              <div className="w-24 h-24 mx-auto mb-24 bg-accent-blue/20 rounded-full flex items-center justify-center animate-pulse-glow">
                <svg className="w-12 h-12 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-text-primary mb-16">
                Ready to Check In
              </p>
              <p className="text-sm text-text-secondary mb-32">
                Position your face within the circle or use fingerprint scanner
              </p>
              <Button onClick={handleCheckIn}>
                Start Biometric Check-In
              </Button>
            </>
          )}
        </div>
      </GlassCard>

      {/* Today's attendance */}
      <GlassCard>
        <h2 className="text-xl font-semibold text-text-primary mb-24">
          Today's Attendance
        </h2>
        <div className="space-y-16">
          <div className="flex items-center justify-between p-16 rounded-glass bg-white/5">
            <div>
              <p className="text-sm font-medium text-text-primary">Check-in Time</p>
              <p className="text-xs text-text-tertiary mt-4">Main Factory Site</p>
            </div>
            <p className="text-base font-semibold text-text-primary font-sf-mono">
              8:15 AM
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default CheckInPage;
