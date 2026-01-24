/**
 * Checklist Service
 *
 * Tracks completion of all required onboarding items
 * COMPLIANCE: No activation without 100% checklist completion
 */

import type { ChecklistItem, ChecklistItemType } from '@/types';
import { db } from '@/utils/db';
import { auditLogger } from './auditLogger';

// All required checklist items in order
export const REQUIRED_CHECKLIST_ITEMS: ChecklistItemType[] = [
  'IDENTITY_CONFIRMED',
  'POPIA_CONSENT',
  'DOC_CERTIFIED_ID',
  'DOC_POLICE_AFFIDAVIT',
  'DOC_BANK_PROOF',
  'DOC_ADDRESS_PROOF',
  'DOC_APPLICATION_FORM',
  'DOC_CV',
  'DATA_PERSONAL_CONFIRMED',
  'DATA_BANK_CONFIRMED',
  'DATA_ADDRESS_CONFIRMED',
  'DATA_APPLICATION_CONFIRMED',
  'FINAL_DECLARATION',
];

// Item descriptions for UI
export const CHECKLIST_ITEM_DESCRIPTIONS: Record<ChecklistItemType, string> = {
  IDENTITY_CONFIRMED: 'Identity confirmation with SA ID number',
  POPIA_CONSENT: 'POPIA consent given (HARD GATE)',
  DOC_CERTIFIED_ID: 'Certified South African ID uploaded',
  DOC_POLICE_AFFIDAVIT: 'Police affidavit uploaded',
  DOC_BANK_PROOF: 'Proof of bank account uploaded',
  DOC_ADDRESS_PROOF: 'Proof of address uploaded',
  DOC_APPLICATION_FORM: 'Application form uploaded',
  DOC_CV: 'CV uploaded',
  DATA_PERSONAL_CONFIRMED: 'Personal data confirmed by candidate',
  DATA_BANK_CONFIRMED: 'Bank details confirmed by candidate',
  DATA_ADDRESS_CONFIRMED: 'Address confirmed by candidate',
  DATA_APPLICATION_CONFIRMED: 'Application data confirmed by candidate',
  FINAL_DECLARATION: 'Final declaration signed',
};

/**
 * Initialize checklist for candidate
 *
 * Creates all required checklist items
 *
 * @param candidateId - Candidate ID
 * @returns Array of created checklist items
 */
export async function initializeChecklist(candidateId: string): Promise<ChecklistItem[]> {
  const items: ChecklistItem[] = [];

  for (const itemType of REQUIRED_CHECKLIST_ITEMS) {
    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      candidateId,
      itemType,
      completed: false,
      validationStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.checklistItems.add(item);
    items.push(item);
  }

  // Log checklist initialization
  await auditLogger.logCandidateAction(
    candidateId,
    'CREATED',
    'SYSTEM',
    undefined,
    { checklistItemCount: items.length },
    'Checklist initialized'
  );

  return items;
}

/**
 * Mark checklist item as completed
 *
 * @param candidateId - Candidate ID
 * @param itemType - Checklist item type
 * @param actor - User ID completing the item
 * @param validationNotes - Optional validation notes
 */
export async function completeChecklistItem(
  candidateId: string,
  itemType: ChecklistItemType,
  actor: string,
  validationNotes?: string
): Promise<void> {
  // Find checklist item
  const items = await db.checklistItems.where('candidateId').equals(candidateId).toArray();
  const item = items.find((i) => i.itemType === itemType);

  if (!item) {
    throw new Error(`Checklist item not found: ${itemType}`);
  }

  if (item.completed) {
    // Already completed, skip
    return;
  }

  const previousState = { ...item };

  // Update item
  const updatedItem: ChecklistItem = {
    ...item,
    completed: true,
    completedAt: new Date().toISOString(),
    completedBy: actor,
    validationStatus: 'VALID',
    validationNotes,
    updatedAt: new Date().toISOString(),
  };

  await db.checklistItems.update(item.id, updatedItem);

  // Log completion
  await auditLogger.logChecklistAction(
    item.id,
    candidateId,
    'UPDATED',
    actor,
    previousState,
    updatedItem
  );
}

/**
 * Invalidate checklist item (e.g., failed validation)
 *
 * @param candidateId - Candidate ID
 * @param itemType - Checklist item type
 * @param actor - User ID invalidating the item
 * @param reason - Reason for invalidation
 */
export async function invalidateChecklistItem(
  candidateId: string,
  itemType: ChecklistItemType,
  actor: string,
  reason: string
): Promise<void> {
  const items = await db.checklistItems.where('candidateId').equals(candidateId).toArray();
  const item = items.find((i) => i.itemType === itemType);

  if (!item) {
    throw new Error(`Checklist item not found: ${itemType}`);
  }

  const previousState = { ...item };

  // Update item
  const updatedItem: ChecklistItem = {
    ...item,
    completed: false,
    completedAt: undefined,
    completedBy: undefined,
    validationStatus: 'INVALID',
    validationNotes: reason,
    updatedAt: new Date().toISOString(),
  };

  await db.checklistItems.update(item.id, updatedItem);

  // Log invalidation
  await auditLogger.logChecklistAction(
    item.id,
    candidateId,
    'REJECTION',
    actor,
    previousState,
    updatedItem
  );
}

/**
 * Get checklist for candidate
 *
 * @param candidateId - Candidate ID
 * @returns Array of checklist items
 */
export async function getChecklist(candidateId: string): Promise<ChecklistItem[]> {
  const items = await db.checklistItems.where('candidateId').equals(candidateId).toArray();

  // Sort by required order
  return items.sort((a, b) => {
    const aIndex = REQUIRED_CHECKLIST_ITEMS.indexOf(a.itemType);
    const bIndex = REQUIRED_CHECKLIST_ITEMS.indexOf(b.itemType);
    return aIndex - bIndex;
  });
}

/**
 * Get checklist completion status
 *
 * @param candidateId - Candidate ID
 * @returns Completion status
 */
export async function getChecklistStatus(candidateId: string): Promise<{
  total: number;
  completed: number;
  pending: number;
  invalid: number;
  percentage: number;
  isComplete: boolean;
  missingItems: ChecklistItemType[];
}> {
  const items = await getChecklist(candidateId);

  const completed = items.filter((i) => i.completed && i.validationStatus === 'VALID').length;
  const pending = items.filter((i) => !i.completed).length;
  const invalid = items.filter((i) => i.validationStatus === 'INVALID').length;
  const total = items.length;

  const percentage = total > 0 ? (completed / total) * 100 : 0;

  const missingItems = items
    .filter((i) => !i.completed || i.validationStatus !== 'VALID')
    .map((i) => i.itemType);

  return {
    total,
    completed,
    pending,
    invalid,
    percentage,
    isComplete: completed === total && invalid === 0,
    missingItems,
  };
}

/**
 * Check if candidate can be verified
 *
 * HARD GATE: Candidate must have 100% checklist completion
 *
 * @param candidateId - Candidate ID
 * @returns true if candidate can be verified
 */
export async function canVerifyCandidate(candidateId: string): Promise<boolean> {
  const status = await getChecklistStatus(candidateId);
  return status.isComplete;
}

/**
 * Get missing required items
 *
 * @param candidateId - Candidate ID
 * @returns Array of missing checklist item types
 */
export async function getMissingItems(candidateId: string): Promise<ChecklistItemType[]> {
  const status = await getChecklistStatus(candidateId);
  return status.missingItems;
}

/**
 * Check if specific item is completed
 *
 * @param candidateId - Candidate ID
 * @param itemType - Checklist item type
 * @returns true if item is completed and valid
 */
export async function isItemCompleted(
  candidateId: string,
  itemType: ChecklistItemType
): Promise<boolean> {
  const items = await db.checklistItems.where('candidateId').equals(candidateId).toArray();
  const item = items.find((i) => i.itemType === itemType);

  return item ? item.completed && item.validationStatus === 'VALID' : false;
}

/**
 * Bulk complete checklist items
 *
 * @param candidateId - Candidate ID
 * @param itemTypes - Array of checklist item types
 * @param actor - User ID completing the items
 */
export async function bulkCompleteItems(
  candidateId: string,
  itemTypes: ChecklistItemType[],
  actor: string
): Promise<void> {
  for (const itemType of itemTypes) {
    await completeChecklistItem(candidateId, itemType, actor);
  }
}

export const checklistService = {
  initializeChecklist,
  completeChecklistItem,
  invalidateChecklistItem,
  getChecklist,
  getChecklistStatus,
  canVerifyCandidate,
  getMissingItems,
  isItemCompleted,
  bulkCompleteItems,
  REQUIRED_CHECKLIST_ITEMS,
  CHECKLIST_ITEM_DESCRIPTIONS,
};
