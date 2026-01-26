/**
 * Biometric Enrollment Component
 *
 * Complete workflow for enrolling participant biometrics (face + fingerprint)
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { FaceCapture } from './FaceCapture';
import { FingerprintPrompt } from './FingerprintPrompt';
import {
  enrollParticipantBiometric,
  type BiometricType,
} from '@/services/biometric/biometricEnrollment';

interface BiometricEnrollmentProps {
  participantId: string;
  participantName: string;
  onComplete: () => void;
  onCancel: () => void;
}

type EnrollmentStep = 'select' | 'face-capture' | 'fingerprint-prompt' | 'complete';

export const BiometricEnrollment: React.FC<BiometricEnrollmentProps> = ({
  participantId,
  participantName,
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<EnrollmentStep>('select');
  const [selectedType, setSelectedType] = useState<BiometricType | null>(null);
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [fingerprintEnrolled, setFingerprintEnrolled] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleTypeSelection = (type: BiometricType) => {
    setSelectedType(type);

    if (type === 'face') {
      setStep('face-capture');
    } else if (type === 'fingerprint') {
      setStep('fingerprint-prompt');
    }
  };

  const handleFaceCapture = async (canvas: HTMLCanvasElement, confidence: number) => {
    try {
      setError(null);

      const result = await enrollParticipantBiometric(
        participantId,
        participantName,
        'face',
        canvas
      );

      if (result.success) {
        setFaceEnrolled(true);
        setFaceConfidence(confidence);
        setStep('complete');
      } else {
        setError(result.error || 'Face enrollment failed');
        setStep('select');
      }
    } catch (err: any) {
      console.error('Face enrollment error:', err);
      setError(err.message);
      setStep('select');
    }
  };

  const handleFingerprintSuccess = () => {
    setFingerprintEnrolled(true);
    setStep('complete');
  };

  const handleBackToSelect = () => {
    setStep('select');
    setSelectedType(null);
    setError(null);
  };

  const handleEnrollAnother = () => {
    setStep('select');
    setSelectedType(null);
    setError(null);
  };

  const handleFinish = () => {
    onComplete();
  };

  // Selection screen
  if (step === 'select') {
    return (
      <div className="glass-card p-24 space-y-24">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-text-primary">
            Choose Enrollment Method
          </h3>
          <p className="text-sm text-text-secondary mt-4">
            Select how you'd like to enroll for biometric check-in
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="glass-card-secondary p-16 rounded-glass-sm border border-status-error/20">
            <div className="flex gap-12">
              <svg
                className="w-5 h-5 text-status-error flex-shrink-0"
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
              <p className="text-sm text-status-error">{error}</p>
            </div>
          </div>
        )}

        {/* Options */}
        <div className="grid gap-16">
          {/* Face recognition option */}
          <button
            onClick={() => handleTypeSelection('face')}
            className="glass-card-secondary p-24 rounded-glass hover:bg-white/10 transition-all focus-ring text-left"
          >
            <div className="flex items-start gap-16">
              <div className="w-12 h-12 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-accent-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-text-primary mb-4">
                  Face Recognition
                </h4>
                <p className="text-sm text-text-secondary mb-12">
                  Use your camera to enroll your face for quick check-in
                </p>
                <ul className="text-xs text-text-tertiary space-y-4">
                  <li>✓ Fast and contactless</li>
                  <li>✓ Works in good lighting</li>
                  <li>✓ No physical contact required</li>
                </ul>
                {faceEnrolled && (
                  <div className="mt-12 flex items-center gap-8 text-status-success text-xs font-medium">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Already enrolled ({(faceConfidence * 100).toFixed(0)}% confidence)
                  </div>
                )}
              </div>
              <svg
                className="w-6 h-6 text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>

          {/* Fingerprint option */}
          <button
            onClick={() => handleTypeSelection('fingerprint')}
            className="glass-card-secondary p-24 rounded-glass hover:bg-white/10 transition-all focus-ring text-left"
          >
            <div className="flex items-start gap-16">
              <div className="w-12 h-12 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-accent-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-text-primary mb-4">
                  Fingerprint Scan
                </h4>
                <p className="text-sm text-text-secondary mb-12">
                  Use your device's fingerprint sensor for secure check-in
                </p>
                <ul className="text-xs text-text-tertiary space-y-4">
                  <li>✓ Highly secure</li>
                  <li>✓ Works in any lighting</li>
                  <li>✓ Reliable authentication</li>
                </ul>
                {fingerprintEnrolled && (
                  <div className="mt-12 flex items-center gap-8 text-status-success text-xs font-medium">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Already enrolled
                  </div>
                )}
              </div>
              <svg
                className="w-6 h-6 text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        </div>

        {/* Info box */}
        <div className="glass-card-secondary p-16 rounded-glass-sm">
          <p className="text-xs text-text-secondary font-medium mb-8">
            Recommended approach:
          </p>
          <p className="text-xs text-text-tertiary">
            Enroll both face and fingerprint for maximum flexibility. You can use either
            method for check-in, and have a backup if one doesn't work.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-12 pt-16 border-t border-white/10">
          <Button onClick={onCancel} variant="secondary" className="flex-1">
            Cancel
          </Button>
          {(faceEnrolled || fingerprintEnrolled) && (
            <Button onClick={handleFinish} variant="primary" className="flex-1">
              Finish
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Face capture screen
  if (step === 'face-capture') {
    return (
      <FaceCapture
        mode="enrollment"
        onCapture={handleFaceCapture}
        onCancel={handleBackToSelect}
      />
    );
  }

  // Fingerprint prompt screen
  if (step === 'fingerprint-prompt') {
    return (
      <FingerprintPrompt
        mode="enrollment"
        participantId={participantId}
        participantName={participantName}
        onSuccess={handleFingerprintSuccess}
        onCancel={handleBackToSelect}
      />
    );
  }

  // Completion screen
  if (step === 'complete') {
    return (
      <div className="glass-card p-24 space-y-24 text-center">
        {/* Success icon */}
        <div className="flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-status-success/20 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-status-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div>
          <h3 className="text-xl font-semibold text-text-primary mb-8">
            Enrollment Successful!
          </h3>
          <p className="text-sm text-text-secondary">
            {selectedType === 'face'
              ? 'Your face has been enrolled successfully'
              : 'Your fingerprint has been enrolled successfully'}
          </p>
        </div>

        {/* Summary */}
        <div className="glass-card-secondary p-16 rounded-glass-sm">
          <p className="text-xs text-text-secondary font-medium mb-12">
            Enrollment summary:
          </p>
          <div className="space-y-8">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-tertiary">Face Recognition:</span>
              <span
                className={
                  faceEnrolled ? 'text-status-success font-medium' : 'text-text-tertiary'
                }
              >
                {faceEnrolled ? `✓ Enrolled (${(faceConfidence * 100).toFixed(0)}%)` : 'Not enrolled'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-tertiary">Fingerprint:</span>
              <span
                className={
                  fingerprintEnrolled ? 'text-status-success font-medium' : 'text-text-tertiary'
                }
              >
                {fingerprintEnrolled ? '✓ Enrolled' : 'Not enrolled'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-12">
          {(!faceEnrolled || !fingerprintEnrolled) && (
            <Button onClick={handleEnrollAnother} variant="secondary" className="w-full">
              Enroll Another Method
            </Button>
          )}
          <Button onClick={handleFinish} variant="primary" className="w-full">
            Finish Enrollment
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
