/**
 * Fingerprint Prompt Component
 *
 * UI for fingerprint enrollment and verification
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import {
  enrollFingerprint,
  verifyFingerprint,
  isFingerprintSupported,
  hasFingerprintSensor,
  getFingerprintErrorMessage,
} from '@/services/biometric/fingerprintScanner';

interface FingerprintPromptProps {
  mode: 'enrollment' | 'verification';
  participantId: string;
  participantName: string;
  onSuccess: (credentialId?: string) => void;
  onCancel: () => void;
}

export const FingerprintPrompt: React.FC<FingerprintPromptProps> = ({
  mode,
  participantId,
  participantName,
  onSuccess,
  onCancel,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSupport, setCheckingSupport] = useState(true);
  const [isSupported, setIsSupported] = useState(false);

  // Check support on mount
  React.useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    setCheckingSupport(true);

    const supported = isFingerprintSupported();

    if (!supported) {
      setIsSupported(false);
      setError('Fingerprint authentication is not supported on this device or browser.');
      setCheckingSupport(false);
      return;
    }

    const hasSensor = await hasFingerprintSensor();

    if (!hasSensor) {
      setIsSupported(false);
      setError('No fingerprint sensor detected on this device.');
      setCheckingSupport(false);
      return;
    }

    setIsSupported(true);
    setCheckingSupport(false);
  };

  const handleEnroll = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await enrollFingerprint(participantId, participantName);

      if (result.success) {
        onSuccess(result.credentialId);
      } else {
        setError(result.error || 'Fingerprint enrollment failed');
      }
    } catch (err: any) {
      console.error('Fingerprint enrollment error:', err);
      setError(getFingerprintErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerify = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await verifyFingerprint(participantId);

      if (result.success) {
        onSuccess(result.credentialId);
      } else {
        setError(result.error || 'Fingerprint verification failed');
      }
    } catch (err: any) {
      console.error('Fingerprint verification error:', err);
      setError(getFingerprintErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceed = () => {
    if (mode === 'enrollment') {
      handleEnroll();
    } else {
      handleVerify();
    }
  };

  const getInstructions = () => {
    if (mode === 'enrollment') {
      return 'You will be prompted to scan your fingerprint. Follow your device instructions to complete enrollment.';
    }
    return 'Scan your fingerprint to verify your identity and complete check-in.';
  };

  if (checkingSupport) {
    return (
      <div className="glass-card p-24 space-y-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent-blue border-t-transparent mx-auto"></div>
        <p className="text-sm text-text-secondary">Checking fingerprint support...</p>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="glass-card p-24 space-y-16">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-status-error/20 flex items-center justify-center mx-auto mb-16">
            <svg
              className="w-8 h-8 text-status-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-8">
            Fingerprint Not Supported
          </h3>
          <p className="text-sm text-status-error">{error}</p>
        </div>

        <div className="glass-card-secondary p-16 rounded-glass-sm">
          <p className="text-xs text-text-secondary font-medium mb-8">
            Alternative options:
          </p>
          <ul className="text-xs text-text-tertiary space-y-4">
            <li>• Use face recognition instead</li>
            <li>• Try a different device with fingerprint sensor</li>
            <li>• Contact your supervisor for assistance</li>
          </ul>
        </div>

        <Button onClick={onCancel} variant="secondary" className="w-full">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="glass-card p-24 space-y-16">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-text-primary">
          {mode === 'enrollment' ? 'Enroll Fingerprint' : 'Verify Fingerprint'}
        </h3>
        <p className="text-sm text-text-secondary mt-4">{getInstructions()}</p>
      </div>

      {/* Fingerprint icon animation */}
      <div className="flex items-center justify-center py-32">
        <div className="relative">
          {/* Pulse animation when processing */}
          {isProcessing && (
            <>
              <div className="absolute inset-0 rounded-full bg-accent-blue/20 animate-ping"></div>
              <div className="absolute inset-0 rounded-full bg-accent-blue/10 animate-pulse"></div>
            </>
          )}

          {/* Fingerprint icon */}
          <div
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-colors ${
              isProcessing
                ? 'bg-accent-blue/20'
                : error
                  ? 'bg-status-error/20'
                  : 'bg-white/10'
            }`}
          >
            <svg
              className={`w-16 h-16 ${
                isProcessing
                  ? 'text-accent-blue animate-pulse'
                  : error
                    ? 'text-status-error'
                    : 'text-text-secondary'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Status message */}
      {error && (
        <div className="glass-card-secondary p-16 rounded-glass-sm border border-status-error/20">
          <div className="flex gap-12">
            <svg
              className="w-5 h-5 text-status-error flex-shrink-0 mt-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-status-error">Error</p>
              <p className="text-xs text-text-secondary mt-4">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="text-center">
          <p className="text-sm text-accent-blue font-medium animate-pulse">
            {mode === 'enrollment'
              ? 'Follow device prompts to scan fingerprint...'
              : 'Verifying fingerprint...'}
          </p>
        </div>
      )}

      {/* Instructions */}
      {!isProcessing && !error && (
        <div className="glass-card-secondary p-16 rounded-glass-sm">
          <p className="text-xs text-text-secondary font-medium mb-8">
            {mode === 'enrollment' ? 'Enrollment steps:' : 'Verification steps:'}
          </p>
          <ul className="text-xs text-text-tertiary space-y-4">
            {mode === 'enrollment' ? (
              <>
                <li>1. Click "Start Enrollment" below</li>
                <li>2. Follow your device prompts</li>
                <li>3. Place your finger on the sensor</li>
                <li>4. Hold until enrollment completes</li>
              </>
            ) : (
              <>
                <li>1. Click "Verify Fingerprint" below</li>
                <li>2. Place your finger on the sensor</li>
                <li>3. Hold until verification completes</li>
              </>
            )}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-12">
        <Button onClick={onCancel} variant="secondary" className="flex-1" disabled={isProcessing}>
          Cancel
        </Button>
        <Button
          onClick={handleProceed}
          variant="primary"
          className="flex-1"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-8"></div>
              Processing...
            </>
          ) : mode === 'enrollment' ? (
            'Start Enrollment'
          ) : (
            'Verify Fingerprint'
          )}
        </Button>
      </div>

      {/* Security notice */}
      <div className="text-center pt-12 border-t border-white/10">
        <p className="text-xs text-text-tertiary">
          <svg
            className="w-3 h-3 inline mr-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Your biometric data is encrypted and stored securely
        </p>
      </div>
    </div>
  );
};
