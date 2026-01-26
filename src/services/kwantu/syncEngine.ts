/**
 * Kwantu Sync Engine
 *
 * Handles synchronization of data to Kwantu platform
 * Supports real-time, scheduled, and manual sync operations
 */

import { db } from '@/utils/db';
import type { Participant, AttendanceRecord, KwantuSyncRecord } from '@/types';

export type SyncFrequency = 'real-time' | 'daily' | 'weekly' | 'monthly' | 'manual';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface SyncResult {
  success: boolean;
  recordId: string;
  recordType: string;
  syncedAt?: string;
  error?: string;
}

export interface SyncProgress {
  total: number;
  synced: number;
  failed: number;
  pending: number;
  percentage: number;
}

/**
 * Sync participant data to Kwantu
 *
 * @param participant - Participant to sync
 * @returns Sync result
 */
export async function syncParticipantToKwantu(
  participant: Participant
): Promise<SyncResult> {
  try {
    // Only sync verified participants
    if (participant.onboardingStatus !== 'verified') {
      return {
        success: false,
        recordId: participant.id,
        recordType: 'participant',
        error: 'Participant not verified',
      };
    }

    // Create sync record
    const syncRecord: KwantuSyncRecord = {
      id: crypto.randomUUID(),
      recordType: 'participant',
      recordId: participant.id,
      payload: {
        fullName: `${participant.firstName} ${participant.lastName}`,
        idNumber: participant.idNumber,
        email: participant.email,
        phoneNumber: participant.phoneNumber,
        dateOfBirth: participant.dateOfBirth,
        siteId: participant.siteId,
        status: participant.status,
        biometricEnrolled: participant.biometricEnrolled,
        popiaConsent: participant.popiaConsentGiven,
        popiaConsentDate: participant.popiaConsentDate,
      },
      status: 'pending',
      attempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real implementation, this would make an API call to Kwantu
    // For now, simulate sync by storing in sync queue
    await db.kwantuSyncRecords.add(syncRecord);

    // Simulate API call with delay
    await simulateKwantuAPI();

    // Update sync record status
    const syncedAt = new Date().toISOString();
    await db.kwantuSyncRecords.update(syncRecord.id, {
      status: 'synced',
      syncedAt,
      updatedAt: syncedAt,
    });

    return {
      success: true,
      recordId: participant.id,
      recordType: 'participant',
      syncedAt,
    };
  } catch (error: any) {
    console.error('Participant sync error:', error);

    return {
      success: false,
      recordId: participant.id,
      recordType: 'participant',
      error: error.message,
    };
  }
}

/**
 * Sync attendance record to Kwantu
 *
 * @param attendance - Attendance record to sync
 * @returns Sync result
 */
export async function syncAttendanceToKwantu(
  attendance: AttendanceRecord
): Promise<SyncResult> {
  try {
    // Don't sync incomplete records (missing check-out)
    if (!attendance.checkOutTime) {
      return {
        success: false,
        recordId: attendance.id,
        recordType: 'attendance',
        error: 'Incomplete attendance record (no check-out)',
      };
    }

    // Create sync record
    const syncRecord: KwantuSyncRecord = {
      id: crypto.randomUUID(),
      recordType: 'attendance',
      recordId: attendance.id,
      payload: {
        participantId: attendance.participantId,
        siteId: attendance.siteId,
        date: attendance.date,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        duration: attendance.duration,
        checkInMethod: attendance.checkInMethod,
        biometricConfidence: attendance.biometricConfidence,
        status: attendance.status,
      },
      status: 'pending',
      attempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.kwantuSyncRecords.add(syncRecord);

    // Simulate API call
    await simulateKwantuAPI();

    // Update attendance record sync status
    const syncedAt = new Date().toISOString();
    await db.attendanceRecords.update(attendance.id, {
      syncStatus: 'synced',
      syncedAt,
    });

    // Update sync record
    await db.kwantuSyncRecords.update(syncRecord.id, {
      status: 'synced',
      syncedAt,
      updatedAt: syncedAt,
    });

    return {
      success: true,
      recordId: attendance.id,
      recordType: 'attendance',
      syncedAt,
    };
  } catch (error: any) {
    console.error('Attendance sync error:', error);

    // Mark as failed
    await db.attendanceRecords.update(attendance.id, {
      syncStatus: 'failed',
      syncError: error.message,
    });

    return {
      success: false,
      recordId: attendance.id,
      recordType: 'attendance',
      error: error.message,
    };
  }
}

/**
 * Sync all pending records
 *
 * @returns Sync progress
 */
export async function syncAllPendingRecords(): Promise<SyncProgress> {
  const results: SyncResult[] = [];

  try {
    // Get all pending attendance records
    const pendingAttendance = await db.attendanceRecords
      .where('syncStatus')
      .equals('pending')
      .toArray();

    // Get all verified participants not yet synced
    const participants = await db.participants.toArray();
    const pendingParticipants = participants.filter(
      (p) => p.onboardingStatus === 'verified'
    );

    const total = pendingAttendance.length + pendingParticipants.length;

    // Sync attendance
    for (const record of pendingAttendance) {
      const result = await syncAttendanceToKwantu(record);
      results.push(result);
    }

    // Sync participants
    for (const participant of pendingParticipants) {
      const result = await syncParticipantToKwantu(participant);
      results.push(result);
    }

    const synced = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const pending = total - synced - failed;
    const percentage = total > 0 ? (synced / total) * 100 : 100;

    return {
      total,
      synced,
      failed,
      pending,
      percentage,
    };
  } catch (error) {
    console.error('Sync all error:', error);

    const synced = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      total: results.length,
      synced,
      failed,
      pending: 0,
      percentage: results.length > 0 ? (synced / results.length) * 100 : 0,
    };
  }
}

/**
 * Get sync queue status
 *
 * @returns Sync progress
 */
export async function getSyncQueueStatus(): Promise<SyncProgress> {
  const pendingAttendance = await db.attendanceRecords
    .where('syncStatus')
    .equals('pending')
    .count();

  const syncedAttendance = await db.attendanceRecords
    .where('syncStatus')
    .equals('synced')
    .count();

  const failedAttendance = await db.attendanceRecords
    .where('syncStatus')
    .equals('failed')
    .count();

  const total = pendingAttendance + syncedAttendance + failedAttendance;
  const percentage = total > 0 ? (syncedAttendance / total) * 100 : 100;

  return {
    total,
    synced: syncedAttendance,
    failed: failedAttendance,
    pending: pendingAttendance,
    percentage,
  };
}

/**
 * Schedule sync operations
 *
 * @param frequency - Sync frequency
 */
export function scheduleSyncOperation(frequency: SyncFrequency): void {
  switch (frequency) {
    case 'daily':
      // Schedule daily sync at 00:30
      scheduleDaily('00:30', syncAllPendingRecords);
      break;

    case 'weekly':
      // Schedule weekly sync on Sunday at 00:00
      scheduleWeekly(0, '00:00', syncAllPendingRecords);
      break;

    case 'monthly':
      // Schedule monthly sync on 1st at 00:00
      scheduleMonthly(1, '00:00', syncAllPendingRecords);
      break;

    case 'real-time':
      // Enable background sync via service worker
      enableBackgroundSync();
      break;

    default:
      console.warn('Unknown sync frequency:', frequency);
  }
}

/**
 * Schedule daily sync
 *
 * @param time - Time in HH:MM format
 * @param callback - Sync function to call
 */
function scheduleDaily(time: string, callback: () => Promise<any>): void {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const scheduled = new Date();

  scheduled.setHours(hours, minutes, 0, 0);

  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }

  const delay = scheduled.getTime() - now.getTime();

  setTimeout(() => {
    callback();
    // Reschedule for next day
    scheduleDaily(time, callback);
  }, delay);

  console.log(`Scheduled daily sync at ${time} (in ${Math.round(delay / 1000 / 60)} minutes)`);
}

/**
 * Schedule weekly sync
 *
 * @param dayOfWeek - Day of week (0 = Sunday, 6 = Saturday)
 * @param time - Time in HH:MM format
 * @param callback - Sync function to call
 */
function scheduleWeekly(
  dayOfWeek: number,
  time: string,
  callback: () => Promise<any>
): void {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const scheduled = new Date();

  scheduled.setHours(hours, minutes, 0, 0);

  const currentDay = now.getDay();
  const daysUntil = (dayOfWeek - currentDay + 7) % 7;

  if (daysUntil === 0 && scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 7);
  } else {
    scheduled.setDate(scheduled.getDate() + daysUntil);
  }

  const delay = scheduled.getTime() - now.getTime();

  setTimeout(() => {
    callback();
    // Reschedule for next week
    scheduleWeekly(dayOfWeek, time, callback);
  }, delay);

  console.log(`Scheduled weekly sync on day ${dayOfWeek} at ${time}`);
}

/**
 * Schedule monthly sync
 *
 * @param dayOfMonth - Day of month (1-31)
 * @param time - Time in HH:MM format
 * @param callback - Sync function to call
 */
function scheduleMonthly(
  dayOfMonth: number,
  time: string,
  callback: () => Promise<any>
): void {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const scheduled = new Date();

  scheduled.setDate(dayOfMonth);
  scheduled.setHours(hours, minutes, 0, 0);

  if (scheduled <= now) {
    scheduled.setMonth(scheduled.getMonth() + 1);
  }

  const delay = scheduled.getTime() - now.getTime();

  setTimeout(() => {
    callback();
    // Reschedule for next month
    scheduleMonthly(dayOfMonth, time, callback);
  }, delay);

  console.log(`Scheduled monthly sync on day ${dayOfMonth} at ${time}`);
}

/**
 * Enable background sync via service worker
 */
function enableBackgroundSync(): void {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((registration) => {
      // Register background sync
      // @ts-ignore - Background Sync API not in standard TypeScript types
      return registration.sync.register('kwantu-sync');
    });

    console.log('Background sync enabled');
  } else {
    console.warn('Background sync not supported');
  }
}

/**
 * Retry failed sync records
 *
 * @param maxAttempts - Maximum retry attempts
 * @returns Number of records retried
 */
export async function retryFailedSyncs(maxAttempts: number = 3): Promise<number> {
  const failedRecords = await db.kwantuSyncRecords
    .where('status')
    .equals('failed')
    .toArray();

  let retriedCount = 0;

  for (const record of failedRecords) {
    if (record.attempts >= maxAttempts) {
      continue;
    }

    try {
      // Update attempts
      await db.kwantuSyncRecords.update(record.id, {
        attempts: record.attempts + 1,
        status: 'pending',
        updatedAt: new Date().toISOString(),
      });

      // Retry based on type
      let result: SyncResult;

      switch (record.recordType) {
        case 'participant': {
          const participant = await db.participants.get(record.recordId);
          if (participant) {
            result = await syncParticipantToKwantu(participant);
            if (result.success) retriedCount++;
          }
          break;
        }

        case 'attendance': {
          const attendance = await db.attendanceRecords.get(record.recordId);
          if (attendance) {
            result = await syncAttendanceToKwantu(attendance);
            if (result.success) retriedCount++;
          }
          break;
        }
      }
    } catch (error) {
      console.error(`Retry failed for record ${record.id}:`, error);
    }
  }

  return retriedCount;
}

/**
 * Simulate Kwantu API call
 * In production, this would be replaced with actual API calls
 */
async function simulateKwantuAPI(): Promise<void> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

  // Simulate occasional failures (5% failure rate)
  if (Math.random() < 0.05) {
    throw new Error('Network error: Connection timeout');
  }
}
