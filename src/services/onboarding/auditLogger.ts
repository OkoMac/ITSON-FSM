/**
 * Audit Logger Service
 *
 * COMPLIANCE: Immutable audit trail for all onboarding actions
 * Required for IDC audits, payroll substantiation, and POPIA compliance
 */

import type {
  OnboardingAuditLog,
  OnboardingEvent,
  OnboardingEventPayload,
} from '@/types';
import { db } from '@/utils/db';

/**
 * Create immutable audit log entry
 *
 * @param log - Audit log data
 * @returns Created log ID
 */
async function createAuditLog(log: Omit<OnboardingAuditLog, 'id' | 'timestamp'>): Promise<string> {
  const timestamp = new Date().toISOString();
  const fullLog: OnboardingAuditLog = {
    id: crypto.randomUUID(),
    ...log,
    timestamp,
  };

  // Insert into immutable audit table (map to existing AuditLog schema)
  await db.auditLogs.add({
    id: fullLog.id,
    userId: fullLog.actor,
    resource: fullLog.entityType,
    resourceId: fullLog.entityId,
    action: fullLog.action.toLowerCase() as any, // Map to lowercase for compatibility
    timestamp: fullLog.timestamp,
    changes: {
      before: fullLog.previousState,
      after: fullLog.newState,
    },
    reason: fullLog.reasonDescription,
    ipAddressHash: fullLog.ipAddressHash || '',
    deviceInfo: fullLog.deviceInfo || '',
    userRole: fullLog.actorRole || 'worker',
    createdAt: fullLog.timestamp,
  });

  return fullLog.id;
}

/**
 * Log state transition
 */
export async function logStateTransition(
  sessionId: string,
  _candidateId: string,
  previousState: any,
  newState: any,
  actor: string,
  action: OnboardingAuditLog['action'],
  reasonCode?: string,
  reasonDescription?: string
): Promise<string> {
  return createAuditLog({
    entityType: 'SESSION',
    entityId: sessionId,
    action,
    actor,
    previousState,
    newState,
    reasonCode,
    reasonDescription,
  });
}

/**
 * Log document action
 */
export async function logDocumentAction(
  documentId: string,
  _candidateId: string,
  action: OnboardingAuditLog['action'],
  actor: string,
  previousState?: any,
  newState?: any,
  reason?: string
): Promise<string> {
  return createAuditLog({
    entityType: 'DOCUMENT',
    entityId: documentId,
    action,
    actor,
    previousState,
    newState,
    reasonDescription: reason,
  });
}

/**
 * Log candidate action
 */
export async function logCandidateAction(
  candidateId: string,
  action: OnboardingAuditLog['action'],
  actor: string,
  previousState?: any,
  newState?: any,
  reason?: string
): Promise<string> {
  return createAuditLog({
    entityType: 'CANDIDATE',
    entityId: candidateId,
    action,
    actor,
    previousState,
    newState,
    reasonDescription: reason,
  });
}

/**
 * Log checklist action
 */
export async function logChecklistAction(
  checklistItemId: string,
  _candidateId: string,
  action: OnboardingAuditLog['action'],
  actor: string,
  previousState?: any,
  newState?: any
): Promise<string> {
  return createAuditLog({
    entityType: 'CHECKLIST',
    entityId: checklistItemId,
    action,
    actor,
    previousState,
    newState,
  });
}

/**
 * Log payroll sync authorization
 */
export async function logPayrollAuthorization(
  syncId: string,
  _candidateId: string,
  actor: string,
  reason: string
): Promise<string> {
  return createAuditLog({
    entityType: 'PAYROLL',
    entityId: syncId,
    action: 'AUTHORIZATION',
    actor,
    reasonDescription: reason,
  });
}

/**
 * Log generic action
 */
export async function logAction(
  entityType: OnboardingAuditLog['entityType'],
  entityId: string,
  action: OnboardingAuditLog['action'],
  actor: string,
  _data?: Record<string, any>,
  previousState?: any,
  newState?: any,
  reasonCode?: string,
  reasonDescription?: string
): Promise<string> {
  return createAuditLog({
    entityType,
    entityId,
    action,
    actor,
    previousState,
    newState,
    reasonCode,
    reasonDescription,
  });
}

/**
 * Log onboarding event
 */
export async function logEvent(
  event: OnboardingEvent,
  candidateId: string,
  sessionId: string,
  actor: string,
  data?: Record<string, any>
): Promise<void> {
  // Create event payload
  const payload: OnboardingEventPayload = {
    event,
    candidateId,
    sessionId,
    timestamp: new Date().toISOString(),
    data,
    actor,
  };

  // Log as audit entry
  await createAuditLog({
    entityType: 'SESSION',
    entityId: sessionId,
    action: 'CREATED',
    actor,
    newState: payload,
    reasonDescription: `Event: ${event}`,
  });

  // In production, emit to event bus for background workers
  // await eventBus.emit(event, payload);
}

/**
 * Get full audit trail for candidate
 *
 * @param candidateId - Candidate ID
 * @returns All audit logs for candidate (chronological)
 */
export async function getCandidateAuditTrail(candidateId: string): Promise<OnboardingAuditLog[]> {
  // Get all logs related to this candidate
  const allLogs = await db.auditLogs.toArray();

  // Filter and transform to OnboardingAuditLog format
  const candidateLogs = allLogs
    .filter((log) => {
      // Include if it's directly about the candidate or references them
      return log.resourceId === candidateId || log.userId === candidateId;
    })
    .map((log) => ({
      id: log.id,
      entityType: log.resource as OnboardingAuditLog['entityType'],
      entityId: log.resourceId,
      action: log.action.toUpperCase() as OnboardingAuditLog['action'],
      actor: log.userId,
      actorRole: log.userRole,
      previousState: log.changes?.before,
      newState: log.changes?.after,
      reasonDescription: log.reason,
      ipAddressHash: log.ipAddressHash,
      deviceInfo: log.deviceInfo,
      timestamp: log.timestamp,
    }));

  // Sort chronologically
  return candidateLogs.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/**
 * Get audit trail for specific entity
 *
 * @param entityType - Entity type
 * @param entityId - Entity ID
 * @returns All audit logs for entity
 */
export async function getEntityAuditTrail(
  entityType: OnboardingAuditLog['entityType'],
  entityId: string
): Promise<OnboardingAuditLog[]> {
  const allLogs = await db.auditLogs.toArray();

  const entityLogs = allLogs
    .filter((log) => log.resource === entityType && log.resourceId === entityId)
    .map((log) => ({
      id: log.id,
      entityType: log.resource as OnboardingAuditLog['entityType'],
      entityId: log.resourceId,
      action: log.action.toUpperCase() as OnboardingAuditLog['action'],
      actor: log.userId,
      actorRole: log.userRole,
      previousState: log.changes?.before,
      newState: log.changes?.after,
      reasonDescription: log.reason,
      ipAddressHash: log.ipAddressHash,
      deviceInfo: log.deviceInfo,
      timestamp: log.timestamp,
    }));

  return entityLogs.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/**
 * Verify audit trail integrity
 *
 * Check that the audit trail is complete and chronologically consistent
 *
 * @param candidateId - Candidate ID
 * @returns Integrity report
 */
export async function verifyAuditIntegrity(candidateId: string): Promise<{
  isValid: boolean;
  issues: string[];
  logCount: number;
}> {
  const logs = await getCandidateAuditTrail(candidateId);
  const issues: string[] = [];

  // Check chronological order
  for (let i = 1; i < logs.length; i++) {
    const prevTime = new Date(logs[i - 1].timestamp).getTime();
    const currTime = new Date(logs[i].timestamp).getTime();

    if (currTime < prevTime) {
      issues.push(`Chronological inconsistency at index ${i}`);
    }
  }

  // Check for required events
  const events = logs.map((log) => log.reasonDescription);
  const requiredEvents = ['OnboardingStarted'];

  requiredEvents.forEach((event) => {
    if (!events.some((e) => e?.includes(event))) {
      issues.push(`Missing required event: ${event}`);
    }
  });

  // Check for gaps in state transitions
  const stateTransitions = logs.filter((log) => log.action === 'STATE_TRANSITION');
  for (let i = 1; i < stateTransitions.length; i++) {
    const prevState = stateTransitions[i - 1].newState;
    const currPrevState = stateTransitions[i].previousState;

    if (prevState !== currPrevState) {
      issues.push(`State transition gap at index ${i}: ${prevState} -> ${currPrevState}`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    logCount: logs.length,
  };
}

// Export audit logger object
export const auditLogger = {
  createAuditLog,
  logStateTransition,
  logDocumentAction,
  logCandidateAction,
  logChecklistAction,
  logPayrollAuthorization,
  logAction,
  logEvent,
  getCandidateAuditTrail,
  getEntityAuditTrail,
  verifyAuditIntegrity,
};
