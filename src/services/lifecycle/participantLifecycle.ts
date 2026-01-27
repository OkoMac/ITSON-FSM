/**
 * Participant Lifecycle Management
 *
 * Manages participant status transitions and lifecycle events
 */

export interface LifecycleTransition {
  id: string;
  participantId: string;
  previousStatus: string;
  newStatus: string;
  fromStatus?: string; // Alias for previousStatus
  toStatus?: string; // Alias for newStatus
  reason: string;
  changedBy: string;
  changedAt: string;
  transitionedAt?: string; // Alias for changedAt
  notes?: string; // Direct field in addition to metadata
  metadata?: {
    exitReason?: string;
    notes?: string;
  };
}

export async function transitionLifecycleStatus(
  participantId: string,
  newStatus: string,
  reason: string,
  changedBy: string,
  metadata?: { exitReason?: string; notes?: string }
): Promise<void> {
  const transition: LifecycleTransition = {
    id: crypto.randomUUID(),
    participantId,
    previousStatus: 'active', // In a real system, fetch current status
    newStatus,
    fromStatus: 'active',
    toStatus: newStatus,
    reason,
    changedBy,
    changedAt: new Date().toISOString(),
    transitionedAt: new Date().toISOString(),
    notes: metadata?.notes,
    metadata,
  };

  localStorage.setItem(`lifecycle_${transition.id}`, JSON.stringify(transition));
}

export async function getLifecycleHistory(participantId: string): Promise<LifecycleTransition[]> {
  const transitions: LifecycleTransition[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('lifecycle_')) {
      const transition = JSON.parse(localStorage.getItem(key)!);
      if (transition.participantId === participantId) {
        transitions.push(transition);
      }
    }
  }
  return transitions.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
}
