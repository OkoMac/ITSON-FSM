/**
 * Biometric Enrollment Service
 *
 * Manages biometric enrollment workflow for participants
 * Combines face recognition and fingerprint scanning
 */

import { db } from '@/utils/db';
import type { Participant } from '@/types';
import {
  enrollFace,
  hasEnrolledFace,
  deleteEnrolledFace,
} from './faceRecognition';
import {
  enrollFingerprint,
  hasEnrolledFingerprint,
  deleteEnrolledFingerprint,
} from './fingerprintScanner';

export type BiometricType = 'face' | 'fingerprint' | 'both';

export interface BiometricEnrollmentStatus {
  participantId: string;
  faceEnrolled: boolean;
  fingerprintEnrolled: boolean;
  canCheckIn: boolean;
  enrolledAt?: string;
  updatedAt?: string;
}

/**
 * Get biometric enrollment status for participant
 *
 * @param participantId - Participant ID
 * @returns Enrollment status
 */
export async function getEnrollmentStatus(
  participantId: string
): Promise<BiometricEnrollmentStatus> {
  const faceEnrolled = hasEnrolledFace(participantId);
  const fingerprintEnrolled = hasEnrolledFingerprint(participantId);

  // Participant can check in if they have at least one biometric enrolled
  const canCheckIn = faceEnrolled || fingerprintEnrolled;

  return {
    participantId,
    faceEnrolled,
    fingerprintEnrolled,
    canCheckIn,
  };
}

/**
 * Enroll participant biometrics
 *
 * @param participantId - Participant ID
 * @param biometricType - Type of biometric to enroll
 * @param imageElement - Image element for face enrollment (if face type)
 * @returns Enrollment result
 */
export async function enrollParticipantBiometric(
  participantId: string,
  participantName: string,
  biometricType: BiometricType,
  imageElement?: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<{
  success: boolean;
  type: BiometricType;
  confidence?: number;
  error?: string;
}> {
  try {
    // Get participant
    const participant = await db.participants.get(participantId);

    if (!participant) {
      return {
        success: false,
        type: biometricType,
        error: 'Participant not found',
      };
    }

    // Enroll based on type
    if (biometricType === 'face' || biometricType === 'both') {
      if (!imageElement) {
        return {
          success: false,
          type: biometricType,
          error: 'Image element required for face enrollment',
        };
      }

      const faceResult = await enrollFace(participantId, imageElement);

      if (!faceResult.success) {
        return {
          success: false,
          type: 'face',
          confidence: faceResult.confidence,
          error: faceResult.error,
        };
      }

      // If enrolling both, continue to fingerprint
      if (biometricType === 'face') {
        return {
          success: true,
          type: 'face',
          confidence: faceResult.confidence,
        };
      }
    }

    if (biometricType === 'fingerprint' || biometricType === 'both') {
      const fingerprintResult = await enrollFingerprint(
        participantId,
        participantName
      );

      if (!fingerprintResult.success) {
        return {
          success: false,
          type: 'fingerprint',
          error: fingerprintResult.error,
        };
      }

      return {
        success: true,
        type: biometricType,
      };
    }

    return {
      success: false,
      type: biometricType,
      error: 'Invalid biometric type',
    };
  } catch (error: any) {
    console.error('Biometric enrollment error:', error);
    return {
      success: false,
      type: biometricType,
      error: error.message,
    };
  }
}

/**
 * Delete participant biometrics
 *
 * @param participantId - Participant ID
 * @param biometricType - Type to delete ('face', 'fingerprint', or 'both')
 */
export async function deleteParticipantBiometric(
  participantId: string,
  biometricType: BiometricType
): Promise<void> {
  if (biometricType === 'face' || biometricType === 'both') {
    deleteEnrolledFace(participantId);
  }

  if (biometricType === 'fingerprint' || biometricType === 'both') {
    deleteEnrolledFingerprint(participantId);
  }
}

/**
 * Check if participant needs to enroll biometrics
 *
 * @param participantId - Participant ID
 * @returns true if enrollment needed
 */
export async function needsBiometricEnrollment(
  participantId: string
): Promise<boolean> {
  const status = await getEnrollmentStatus(participantId);
  return !status.canCheckIn;
}

/**
 * Update participant onboarding status after biometric enrollment
 *
 * @param participantId - Participant ID
 */
export async function updateParticipantAfterEnrollment(
  participantId: string
): Promise<void> {
  const participant = await db.participants.get(participantId);

  if (!participant) {
    throw new Error('Participant not found');
  }

  const status = await getEnrollmentStatus(participantId);

  if (status.canCheckIn) {
    // Update participant status to active
    await db.participants.update(participantId, {
      status: 'active',
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Get all participants requiring biometric enrollment
 *
 * @returns Array of participants needing enrollment
 */
export async function getParticipantsNeedingEnrollment(): Promise<Participant[]> {
  const allParticipants = await db.participants.toArray();

  const needingEnrollment: Participant[] = [];

  for (const participant of allParticipants) {
    const status = await getEnrollmentStatus(participant.id);

    if (!status.canCheckIn && participant.onboardingStatus === 'verified') {
      needingEnrollment.push(participant);
    }
  }

  return needingEnrollment;
}

/**
 * Validate biometric enrollment quality
 *
 * @param participantId - Participant ID
 * @returns Validation result
 */
export async function validateEnrollmentQuality(
  participantId: string
): Promise<{
  isValid: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const status = await getEnrollmentStatus(participantId);
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check if at least one biometric is enrolled
  if (!status.canCheckIn) {
    issues.push('No biometric enrolled');
    recommendations.push('Enroll at least one biometric (face or fingerprint)');
  }

  // Recommend enrolling both for redundancy
  if (status.faceEnrolled && !status.fingerprintEnrolled) {
    recommendations.push(
      'Consider enrolling fingerprint as backup authentication method'
    );
  }

  if (!status.faceEnrolled && status.fingerprintEnrolled) {
    recommendations.push('Consider enrolling face for faster check-in');
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations,
  };
}
