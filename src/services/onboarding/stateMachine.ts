/**
 * Onboarding State Machine
 *
 * COMPLIANCE: Non-bypassable state transitions with full audit trail
 * All state changes are logged and require reason codes for overrides
 */

import type { OnboardingSession, OnboardingEvent } from '@/types';
import { db } from '@/utils/db';
import { auditLogger } from './auditLogger';

// State machine definition
type OnboardingState = OnboardingSession['state'];

// Valid state transitions
const VALID_TRANSITIONS: Record<OnboardingState, OnboardingState[]> = {
  NOT_STARTED: ['IN_PROGRESS'],
  IN_PROGRESS: ['DOCUMENTS_UPLOADED', 'FAILED'],
  DOCUMENTS_UPLOADED: ['PROCESSING', 'FAILED'],
  PROCESSING: ['AWAITING_CONFIRMATION', 'FAILED'],
  AWAITING_CONFIRMATION: ['VERIFIED', 'FAILED', 'IN_PROGRESS'], // Can go back to IN_PROGRESS if validation fails
  VERIFIED: ['SYNC_READY'],
  SYNC_READY: [], // Terminal state
  FAILED: ['IN_PROGRESS'], // Can restart from FAILED
};

// Events that trigger state transitions
const EVENT_TO_STATE_MAP: Record<OnboardingEvent, { from: OnboardingState; to: OnboardingState }[]> = {
  OnboardingStarted: [{ from: 'NOT_STARTED', to: 'IN_PROGRESS' }],
  DocumentsUploaded: [{ from: 'IN_PROGRESS', to: 'DOCUMENTS_UPLOADED' }],
  ExtractionCompleted: [{ from: 'DOCUMENTS_UPLOADED', to: 'PROCESSING' }],
  ValidationFailed: [
    { from: 'PROCESSING', to: 'FAILED' },
    { from: 'AWAITING_CONFIRMATION', to: 'FAILED' },
  ],
  ConfirmationCompleted: [{ from: 'AWAITING_CONFIRMATION', to: 'VERIFIED' }],
  OnboardingVerified: [{ from: 'VERIFIED', to: 'SYNC_READY' }],
  PayrollSyncAuthorized: [{ from: 'SYNC_READY', to: 'SYNC_READY' }], // No state change, but logged
  SessionLocked: [], // Can happen from any state
  OverrideApplied: [], // Can override to any state with reason
};

/**
 * Transition onboarding session to new state
 *
 * @param sessionId - Session ID
 * @param newState - Target state
 * @param actor - User ID performing the transition
 * @param reasonCode - Reason code (required for overrides)
 * @returns Updated session
 * @throws Error if transition is invalid
 */
export async function transitionState(
  sessionId: string,
  newState: OnboardingState,
  actor: string,
  reasonCode?: string,
  reasonDescription?: string
): Promise<OnboardingSession> {
  // Get current session
  const session = await db.onboardingSessions.get(sessionId);

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Check if session is locked
  if (session.locked) {
    throw new Error(`Session is locked: ${session.lockReason || 'No reason provided'}`);
  }

  const currentState = session.state;

  // Check if transition is valid
  const isValidTransition = VALID_TRANSITIONS[currentState]?.includes(newState);

  if (!isValidTransition) {
    // Check if this is an override
    if (!reasonCode) {
      throw new Error(
        `Invalid state transition from ${currentState} to ${newState}. Reason code required for override.`
      );
    }

    // Log override attempt
    await auditLogger.logStateTransition(
      sessionId,
      session.candidateId,
      currentState,
      newState,
      actor,
      'OVERRIDE',
      reasonCode,
      reasonDescription
    );
  } else {
    // Log normal state transition
    await auditLogger.logStateTransition(
      sessionId,
      session.candidateId,
      currentState,
      newState,
      actor,
      'STATE_TRANSITION'
    );
  }

  // Update session
  const updatedSession: OnboardingSession = {
    ...session,
    state: newState,
    updatedAt: new Date().toISOString(),
  };

  // If transitioning to VERIFIED or FAILED, mark completion
  if (newState === 'VERIFIED' || newState === 'SYNC_READY') {
    updatedSession.completedAt = new Date().toISOString();
  }

  await db.onboardingSessions.update(sessionId, updatedSession);

  return updatedSession;
}

/**
 * Process onboarding event and trigger state transition
 *
 * @param event - Event type
 * @param sessionId - Session ID
 * @param candidateId - Candidate ID
 * @param actor - User ID performing the action
 * @param data - Additional event data
 */
export async function processEvent(
  event: OnboardingEvent,
  sessionId: string,
  candidateId: string,
  actor: string,
  data?: Record<string, any>
): Promise<void> {
  const session = await db.onboardingSessions.get(sessionId);

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const currentState = session.state;

  // Find valid transition for this event
  const validTransitions = EVENT_TO_STATE_MAP[event] || [];
  const transition = validTransitions.find((t) => t.from === currentState);

  if (!transition) {
    throw new Error(`Event ${event} cannot be processed in state ${currentState}`);
  }

  // Log event
  await auditLogger.logEvent(event, candidateId, sessionId, actor, data);

  // Perform state transition
  await transitionState(sessionId, transition.to, actor);
}

/**
 * Lock onboarding session (prevents further changes)
 *
 * @param sessionId - Session ID
 * @param reason - Reason for locking
 * @param actor - User ID performing the lock
 */
export async function lockSession(
  sessionId: string,
  reason: string,
  actor: string
): Promise<void> {
  const session = await db.onboardingSessions.get(sessionId);

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Update session
  await db.onboardingSessions.update(sessionId, {
    locked: true,
    lockedAt: new Date().toISOString(),
    lockReason: reason,
    updatedAt: new Date().toISOString(),
  });

  // Log lock action
  await auditLogger.logAction(
    'SESSION',
    sessionId,
    'UPDATED',
    actor,
    { reason },
    session.state,
    { ...session, locked: true, lockReason: reason }
  );

  // Emit event
  await auditLogger.logEvent('SessionLocked', session.candidateId, sessionId, actor, { reason });
}

/**
 * Increment response count and check if limit reached
 *
 * @param sessionId - Session ID
 * @returns Updated response count
 * @throws Error if limit reached
 */
export async function incrementResponseCount(sessionId: string): Promise<number> {
  const session = await db.onboardingSessions.get(sessionId);

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const newCount = (session.responseCount || 0) + 1;

  // HARD LIMIT: Max 6 responses
  if (newCount > 6) {
    // Lock session automatically
    await lockSession(
      sessionId,
      'Maximum response count (6) exceeded',
      'SYSTEM'
    );

    throw new Error('Maximum response count (6) exceeded. Session locked.');
  }

  // Update session
  await db.onboardingSessions.update(sessionId, {
    responseCount: newCount,
    updatedAt: new Date().toISOString(),
  });

  // If reached 6, lock session
  if (newCount === 6) {
    await lockSession(
      sessionId,
      'Response limit reached (6/6)',
      'SYSTEM'
    );
  }

  return newCount;
}

/**
 * Check if candidate can proceed to next step
 *
 * @param candidateId - Candidate ID
 * @param requiredState - Required state to proceed
 * @returns true if candidate can proceed
 */
export async function canProceed(
  candidateId: string,
  requiredState: OnboardingState
): Promise<boolean> {
  const sessions = await db.onboardingSessions
    .where('candidateId')
    .equals(candidateId)
    .toArray();

  if (sessions.length === 0) {
    return false;
  }

  // Get latest session
  const latestSession = sessions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  // Define state hierarchy
  const stateHierarchy: OnboardingState[] = [
    'NOT_STARTED',
    'IN_PROGRESS',
    'DOCUMENTS_UPLOADED',
    'PROCESSING',
    'AWAITING_CONFIRMATION',
    'VERIFIED',
    'SYNC_READY',
  ];

  const currentIndex = stateHierarchy.indexOf(latestSession.state);
  const requiredIndex = stateHierarchy.indexOf(requiredState);

  return currentIndex >= requiredIndex;
}

/**
 * Validate state transition without executing it
 *
 * @param currentState - Current state
 * @param newState - Target state
 * @returns true if transition is valid
 */
export function isValidTransition(
  currentState: OnboardingState,
  newState: OnboardingState
): boolean {
  return VALID_TRANSITIONS[currentState]?.includes(newState) || false;
}

/**
 * Get all valid next states from current state
 *
 * @param currentState - Current state
 * @returns Array of valid next states
 */
export function getValidNextStates(currentState: OnboardingState): OnboardingState[] {
  return VALID_TRANSITIONS[currentState] || [];
}
