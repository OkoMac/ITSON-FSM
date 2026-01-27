/**
 * Participant Lifecycle Management
 *
 * Tracks participant journey through statuses:
 * - ONBOARDING: Initial registration
 * - ACTIVE: Working on programme
 * - SUSPENDED: Temporarily inactive
 * - EXITED: Left programme
 * - REPLACED: Replaced by another participant
 * - GRADUATED: Successfully completed programme
 */

import { db } from '@/utils/db';
import type { Participant } from '@/types';

export type LifecycleStatus =
  | 'ONBOARDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'EXITED'
  | 'REPLACED'
  | 'GRADUATED';

export type ExitReason =
  | 'COMPLETED_PROGRAMME'
  | 'VOLUNTARY_EXIT'
  | 'TERMINATED'
  | 'ATTENDANCE_ISSUES'
  | 'PERFORMANCE_ISSUES'
  | 'HEALTH_REASONS'
  | 'RELOCATION'
  | 'OTHER';

export interface LifecycleEvent {
  id: string;
  participantId: string;
  fromStatus: LifecycleStatus | null;
  toStatus: LifecycleStatus;
  reason: string;
  exitReason?: ExitReason;
  replacedById?: string; // ID of replacement participant
  notes?: string;
  actorId: string;
  timestamp: string;
}

export interface ExitRecord {
  id: string;
  participantId: string;
  exitDate: string;
  exitReason: ExitReason;
  details: string;
  finalPayment?: {
    amount: number;
    date: string;
    reference: string;
  };
  referenceLetterIssued: boolean;
  replacementId?: string;
  createdBy: string;
  createdAt: string;
}

export interface ReplacementRecord {
  id: string;
  originalParticipantId: string;
  replacementParticipantId: string;
  reason: string;
  effectiveDate: string;
  siteId: string;
  approvedBy: string;
  createdAt: string;
}

/**
 * Transition participant to new lifecycle status
 */
export async function transitionLifecycleStatus(
  participantId: string,
  newStatus: LifecycleStatus,
  reason: string,
  actorId: string,
  options?: {
    exitReason?: ExitReason;
    replacedById?: string;
    notes?: string;
  }
): Promise<void> {
  const participant = await db.participants.get(participantId);

  if (!participant) {
    throw new Error(`Participant ${participantId} not found`);
  }

  const currentStatus = (participant.status || 'ONBOARDING') as LifecycleStatus;

  // Validate transition
  validateLifecycleTransition(currentStatus, newStatus);

  // Create lifecycle event
  const event: LifecycleEvent = {
    id: crypto.randomUUID(),
    participantId,
    fromStatus: currentStatus,
    toStatus: newStatus,
    reason,
    exitReason: options?.exitReason,
    replacedById: options?.replacedById,
    notes: options?.notes,
    actorId,
    timestamp: new Date().toISOString(),
  };

  // Store lifecycle event
  await storeLifecycleEvent(event);

  // Update participant status
  await db.participants.update(participantId, {
    status: newStatus,
    statusChangedAt: new Date().toISOString(),
    statusChangedBy: actorId,
    updatedAt: new Date().toISOString(),
  });

  // Handle status-specific actions
  await handleStatusActions(participant, newStatus, event, options);

  console.log(`Transitioned participant ${participantId} from ${currentStatus} to ${newStatus}`);
}

/**
 * Validate lifecycle transition
 */
function validateLifecycleTransition(from: LifecycleStatus, to: LifecycleStatus): void {
  const validTransitions: Record<LifecycleStatus, LifecycleStatus[]> = {
    ONBOARDING: ['ACTIVE', 'EXITED'],
    ACTIVE: ['SUSPENDED', 'EXITED', 'REPLACED', 'GRADUATED'],
    SUSPENDED: ['ACTIVE', 'EXITED'],
    EXITED: [], // Terminal state
    REPLACED: [], // Terminal state
    GRADUATED: [], // Terminal state
  };

  const allowed = validTransitions[from];

  if (!allowed.includes(to)) {
    throw new Error(`Invalid transition from ${from} to ${to}`);
  }
}

/**
 * Handle status-specific actions
 */
async function handleStatusActions(
  participant: Participant,
  newStatus: LifecycleStatus,
  event: LifecycleEvent,
  options?: any
): Promise<void> {
  switch (newStatus) {
    case 'ACTIVE':
      await handleActivation(participant);
      break;

    case 'EXITED':
      await handleExit(participant, event, options?.exitReason);
      break;

    case 'REPLACED':
      await handleReplacement(participant, event, options?.replacedById);
      break;

    case 'GRADUATED':
      await handleGraduation(participant);
      break;

    case 'SUSPENDED':
      await handleSuspension(participant, event.reason);
      break;
  }
}

/**
 * Handle activation
 */
async function handleActivation(participant: Participant): Promise<void> {
  // Send welcome notification
  await db.notifications.add({
    id: crypto.randomUUID(),
    userId: participant.userId,
    type: 'general',
    title: 'Welcome to ITSON FSM',
    message: 'Your profile has been activated. You can now check in and start working.',
    read: false,
    createdAt: new Date().toISOString(),
  });

  // Enable check-in capability
  await db.participants.update(participant.id, {
    canCheckIn: true,
  });
}

/**
 * Handle exit
 */
async function handleExit(
  participant: Participant,
  event: LifecycleEvent,
  exitReason?: ExitReason
): Promise<void> {
  // Create exit record
  const exitRecord: ExitRecord = {
    id: crypto.randomUUID(),
    participantId: participant.id,
    exitDate: new Date().toISOString(),
    exitReason: exitReason || 'OTHER',
    details: event.reason,
    referenceLetterIssued: false,
    createdBy: event.actorId,
    createdAt: new Date().toISOString(),
  };

  await storeExitRecord(exitRecord);

  // Disable check-in capability
  await db.participants.update(participant.id, {
    canCheckIn: false,
    exitDate: new Date().toISOString(),
  });

  // Notify supervisors
  await notifySupervisorsOfExit(participant, exitReason);
}

/**
 * Handle replacement
 */
async function handleReplacement(
  participant: Participant,
  event: LifecycleEvent,
  replacementId?: string
): Promise<void> {
  if (!replacementId) {
    throw new Error('Replacement ID required for REPLACED status');
  }

  const replacement = await db.participants.get(replacementId);

  if (!replacement) {
    throw new Error(`Replacement participant ${replacementId} not found`);
  }

  // Create replacement record
  const replacementRecord: ReplacementRecord = {
    id: crypto.randomUUID(),
    originalParticipantId: participant.id,
    replacementParticipantId: replacementId,
    reason: event.reason,
    effectiveDate: new Date().toISOString(),
    siteId: participant.siteId || '',
    approvedBy: event.actorId,
    createdAt: new Date().toISOString(),
  };

  await storeReplacementRecord(replacementRecord);

  // Transfer site assignment to replacement
  if (participant.siteId) {
    await db.participants.update(replacementId, {
      siteId: participant.siteId,
      siteName: participant.siteName,
    });
  }

  // Disable original participant
  await db.participants.update(participant.id, {
    canCheckIn: false,
    replacedById: replacementId,
  });
}

/**
 * Handle graduation
 */
async function handleGraduation(participant: Participant): Promise<void> {
  // Send congratulations
  await db.notifications.add({
    id: crypto.randomUUID(),
    userId: participant.userId,
    type: 'general',
    title: 'Congratulations on Completing the Programme!',
    message:
      'You have successfully graduated from the ITSON FSM programme. A reference letter will be issued shortly.',
    read: false,
    createdAt: new Date().toISOString(),
  });

  // Generate reference letter (trigger)
  await triggerReferenceLetterGeneration(participant.id);

  // Update participant
  await db.participants.update(participant.id, {
    graduationDate: new Date().toISOString(),
    canCheckIn: false,
  });
}

/**
 * Handle suspension
 */
async function handleSuspension(participant: Participant, reason: string): Promise<void> {
  // Notify participant
  await db.notifications.add({
    id: crypto.randomUUID(),
    userId: participant.userId,
    type: 'general',
    title: 'Profile Suspended',
    message: `Your profile has been temporarily suspended. Reason: ${reason}`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  // Disable check-in temporarily
  await db.participants.update(participant.id, {
    canCheckIn: false,
    suspensionReason: reason,
    suspendedAt: new Date().toISOString(),
  });
}

/**
 * Get participant lifecycle history
 */
export async function getLifecycleHistory(participantId: string): Promise<LifecycleEvent[]> {
  return await getLifecycleEvents(participantId);
}

/**
 * Get active participants
 */
export async function getActiveParticipants(): Promise<Participant[]> {
  return await db.participants.where('status').equals('ACTIVE').toArray();
}

/**
 * Get exited participants
 */
export async function getExitedParticipants(
  startDate?: string,
  endDate?: string
): Promise<Participant[]> {
  let participants = await db.participants.where('status').equals('EXITED').toArray();

  if (startDate && endDate) {
    participants = participants.filter((p) => {
      const exitDate = p.exitDate;
      if (!exitDate) return false;
      return exitDate >= startDate && exitDate <= endDate;
    });
  }

  return participants;
}

/**
 * Get replacement history
 */
export async function getReplacementHistory(): Promise<ReplacementRecord[]> {
  return await getReplacementRecords();
}

// Storage functions (implement based on your database structure)

async function storeLifecycleEvent(event: LifecycleEvent): Promise<void> {
  const key = `lifecycle_event_${event.id}`;
  localStorage.setItem(key, JSON.stringify(event));
}

async function getLifecycleEvents(participantId: string): Promise<LifecycleEvent[]> {
  const events: LifecycleEvent[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('lifecycle_event_')) {
      const data = localStorage.getItem(key);
      if (data) {
        const event = JSON.parse(data);
        if (event.participantId === participantId) {
          events.push(event);
        }
      }
    }
  }

  return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

async function storeExitRecord(record: ExitRecord): Promise<void> {
  const key = `exit_record_${record.id}`;
  localStorage.setItem(key, JSON.stringify(record));
}

async function storeReplacementRecord(record: ReplacementRecord): Promise<void> {
  const key = `replacement_record_${record.id}`;
  localStorage.setItem(key, JSON.stringify(record));
}

async function getReplacementRecords(): Promise<ReplacementRecord[]> {
  const records: ReplacementRecord[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('replacement_record_')) {
      const data = localStorage.getItem(key);
      if (data) {
        records.push(JSON.parse(data));
      }
    }
  }

  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function notifySupervisorsOfExit(
  participant: Participant,
  exitReason?: ExitReason
): Promise<void> {
  const supervisors = await db.users.where('role').equals('supervisor').toArray();

  for (const supervisor of supervisors) {
    await db.notifications.add({
      id: crypto.randomUUID(),
      userId: supervisor.id,
      type: 'general',
      title: 'Participant Exited',
      message: `${participant.fullName} has exited the programme. Reason: ${exitReason || 'Not specified'}`,
      metadata: { participantId: participant.id },
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
}

async function triggerReferenceLetterGeneration(participantId: string): Promise<void> {
  // Queue reference letter generation
  const key = `pending_reference_${participantId}`;
  localStorage.setItem(
    key,
    JSON.stringify({
      participantId,
      requested: new Date().toISOString(),
      status: 'PENDING',
    })
  );
}
