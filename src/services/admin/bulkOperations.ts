/**
 * Bulk Operations & Exception Handling
 *
 * Handles:
 * - Bulk candidate creation
 * - Retrofit onboarding
 * - Exception handling with override system
 * - ID verification and cross-checking
 * - Escalation workflows
 */

import { db } from '@/utils/db';
import type { Participant } from '@/types';

export interface BulkUploadRecord {
  row: number;
  idNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  error?: string;
  participantId?: string;
}

export interface Override {
  id: string;
  entityType: string;
  entityId: string;
  field: string;
  originalValue: any;
  overrideValue: any;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  resolvedAt?: string;
}

export interface IDVerificationResult {
  valid: boolean;
  checksumValid: boolean;
  dateOfBirthValid: boolean;
  genderValid: boolean;
  citizenshipValid: boolean;
  issues: string[];
}

/**
 * Bulk create participants from CSV/Excel data
 */
export async function bulkCreateParticipants(
  records: Omit<BulkUploadRecord, 'status' | 'participantId'>[],
  createdBy: string
): Promise<BulkUploadRecord[]> {
  const results: BulkUploadRecord[] = [];

  for (const record of records) {
    try {
      // Validate ID number
      const idValidation = verifyIDNumber(record.idNumber);

      if (!idValidation.valid) {
        results.push({
          ...record,
          status: 'FAILED',
          error: `Invalid ID: ${idValidation.issues.join(', ')}`,
        });
        continue;
      }

      // Check for duplicates
      const existing = await db.participants.where('idNumber').equals(record.idNumber).first();

      if (existing) {
        results.push({
          ...record,
          status: 'FAILED',
          error: 'Participant with this ID already exists',
        });
        continue;
      }

      // Create participant
      const participant: Participant = {
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        idNumber: record.idNumber,
        firstName: record.firstName,
        lastName: record.lastName,
        fullName: `${record.firstName} ${record.lastName}`,
        email: record.email,
        phoneNumber: record.phoneNumber,
        dateOfBirth: extractDateOfBirthFromID(record.idNumber),
        address: '',
        onboardingStatus: 'pending',
        onboardingStep: 0,
        documents: [],
        biometricEnrolled: false,
        popiaConsentGiven: false,
        status: 'ONBOARDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.participants.add(participant);

      results.push({
        ...record,
        status: 'SUCCESS',
        participantId: participant.id,
      });
    } catch (error) {
      results.push({
        ...record,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Verify South African ID Number
 */
export function verifyIDNumber(idNumber: string): IDVerificationResult {
  const result: IDVerificationResult = {
    valid: true,
    checksumValid: false,
    dateOfBirthValid: false,
    genderValid: false,
    citizenshipValid: false,
    issues: [],
  };

  // Check length
  if (idNumber.length !== 13) {
    result.valid = false;
    result.issues.push('ID must be 13 digits');
    return result;
  }

  // Check if all digits
  if (!/^\d{13}$/.test(idNumber)) {
    result.valid = false;
    result.issues.push('ID must contain only digits');
    return result;
  }

  // Extract components
  const year = idNumber.substring(0, 2);
  const month = idNumber.substring(2, 4);
  const day = idNumber.substring(4, 6);
  const gender = parseInt(idNumber.substring(6, 10));
  const citizenship = idNumber.charAt(10);
  const checksum = parseInt(idNumber.charAt(12));

  // Validate date of birth
  const monthNum = parseInt(month);
  const dayNum = parseInt(day);

  if (monthNum < 1 || monthNum > 12) {
    result.issues.push('Invalid month');
  } else if (dayNum < 1 || dayNum > 31) {
    result.issues.push('Invalid day');
  } else {
    result.dateOfBirthValid = true;
  }

  // Validate gender (0-4999 = female, 5000-9999 = male)
  result.genderValid = gender >= 0 && gender <= 9999;

  // Validate citizenship (0 = SA citizen, 1 = permanent resident)
  result.citizenshipValid = citizenship === '0' || citizenship === '1';

  // Validate checksum using Luhn algorithm
  result.checksumValid = validateIDChecksum(idNumber);

  if (!result.checksumValid) {
    result.issues.push('Invalid checksum');
  }

  result.valid =
    result.checksumValid &&
    result.dateOfBirthValid &&
    result.genderValid &&
    result.citizenshipValid &&
    result.issues.length === 0;

  return result;
}

/**
 * Validate ID checksum using Luhn algorithm
 */
function validateIDChecksum(idNumber: string): boolean {
  const digits = idNumber.split('').map(Number);
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    let digit = digits[i];

    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
  }

  const calculatedChecksum = (10 - (sum % 10)) % 10;
  return calculatedChecksum === digits[12];
}

/**
 * Extract date of birth from ID number
 */
export function extractDateOfBirthFromID(idNumber: string): string {
  const year = parseInt(idNumber.substring(0, 2));
  const month = idNumber.substring(2, 4);
  const day = idNumber.substring(4, 6);

  // Determine century (assume 00-30 = 2000s, 31-99 = 1900s)
  const fullYear = year <= 30 ? 2000 + year : 1900 + year;

  return `${fullYear}-${month}-${day}`;
}

/**
 * Request override for exception
 */
export async function requestOverride(
  entityType: string,
  entityId: string,
  field: string,
  originalValue: any,
  overrideValue: any,
  reason: string,
  requestedBy: string
): Promise<Override> {
  const override: Override = {
    id: crypto.randomUUID(),
    entityType,
    entityId,
    field,
    originalValue,
    overrideValue,
    reason,
    requestedBy,
    status: 'PENDING',
    requestedAt: new Date().toISOString(),
  };

  await storeOverride(override);

  // Notify approvers (project managers, property points)
  await notifyApprovers(override);

  return override;
}

/**
 * Approve override
 */
export async function approveOverride(overrideId: string, approvedBy: string): Promise<void> {
  const override = await getOverride(overrideId);

  if (!override) {
    throw new Error('Override not found');
  }

  // Apply the override
  await applyOverride(override);

  // Update override status
  override.status = 'APPROVED';
  override.approvedBy = approvedBy;
  override.resolvedAt = new Date().toISOString();

  await storeOverride(override);

  // Notify requester
  await db.notifications.add({
    id: crypto.randomUUID(),
    userId: override.requestedBy,
    type: 'general',
    title: 'Override Approved',
    message: `Your override request for ${override.entityType} has been approved.`,
    metadata: { overrideId },
    read: false,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Reject override
 */
export async function rejectOverride(
  overrideId: string,
  rejectedBy: string,
  reason: string
): Promise<void> {
  const override = await getOverride(overrideId);

  if (!override) {
    throw new Error('Override not found');
  }

  override.status = 'REJECTED';
  override.approvedBy = rejectedBy;
  override.resolvedAt = new Date().toISOString();

  await storeOverride(override);

  // Notify requester
  await db.notifications.add({
    id: crypto.randomUUID(),
    userId: override.requestedBy,
    type: 'general',
    title: 'Override Rejected',
    message: `Your override request was rejected. Reason: ${reason}`,
    metadata: { overrideId },
    read: false,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Apply override to entity
 */
async function applyOverride(override: Override): Promise<void> {
  switch (override.entityType) {
    case 'participant':
      await db.participants.update(override.entityId, {
        [override.field]: override.overrideValue,
        updatedAt: new Date().toISOString(),
      });
      break;

    case 'document':
      await db.documents.update(override.entityId, {
        [override.field]: override.overrideValue,
        updatedAt: new Date().toISOString(),
      });
      break;

    // Add more entity types as needed
  }
}

/**
 * Retrofit onboarding for existing participants
 */
export async function retrofitOnboarding(participantId: string, actorId: string): Promise<void> {
  const participant = await db.participants.get(participantId);

  if (!participant) {
    throw new Error('Participant not found');
  }

  // Create onboarding session
  await db.onboardingSessions.add({
    id: crypto.randomUUID(),
    candidateId: participantId,
    state: 'PENDING_DOCUMENTS',
    responseCount: 0,
    locked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Update participant
  await db.participants.update(participantId, {
    onboardingStatus: 'in-progress',
    updatedAt: new Date().toISOString(),
  });

  // Notify participant
  await db.notifications.add({
    id: crypto.randomUUID(),
    userId: participant.userId,
    type: 'general',
    title: 'Complete Your Onboarding',
    message: 'Please complete your onboarding process to continue using the platform.',
    read: false,
    createdAt: new Date().toISOString(),
  });
}

// Storage functions

async function storeOverride(override: Override): Promise<void> {
  const key = `override_${override.id}`;
  localStorage.setItem(key, JSON.stringify(override));
}

async function getOverride(overrideId: string): Promise<Override | null> {
  const key = `override_${overrideId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

async function notifyApprovers(override: Override): Promise<void> {
  const approvers = await db.users
    .where('role')
    .anyOf(['project-manager', 'property-point'])
    .toArray();

  for (const approver of approvers) {
    await db.notifications.add({
      id: crypto.randomUUID(),
      userId: approver.id,
      type: 'general',
      title: 'Override Request Pending',
      message: `Override request for ${override.entityType}: ${override.reason}`,
      metadata: { overrideId: override.id },
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
}

export async function getPendingOverrides(): Promise<Override[]> {
  const overrides: Override[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('override_')) {
      const data = localStorage.getItem(key);
      if (data) {
        const override = JSON.parse(data);
        if (override.status === 'PENDING') {
          overrides.push(override);
        }
      }
    }
  }

  return overrides.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}
