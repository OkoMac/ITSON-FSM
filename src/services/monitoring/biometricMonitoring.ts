/**
 * Biometric Success Rate Monitoring & Device Management
 *
 * Tracks biometric authentication success rates and manages devices
 */

import { db } from '@/utils/db';

export interface BiometricAttempt {
  id: string;
  participantId: string;
  attemptType: 'face' | 'fingerprint';
  success: boolean;
  confidence?: number;
  failureReason?: string;
  deviceId: string;
  timestamp: string;
}

export interface BiometricSuccessReport {
  period: string;
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  byType: {
    face: { total: number; successful: number; rate: number };
    fingerprint: { total: number; successful: number; rate: number };
  };
  meetsThreshold: boolean; // 80% threshold
}

export interface Device {
  id: string;
  type: 'tablet' | 'smartphone' | 'biometric-scanner';
  model: string;
  serialNumber: string;
  assignedTo?: string; // userId
  assignedSite?: string;
  status: 'active' | 'maintenance' | 'lost' | 'retired';
  lastSeen?: string;
  batteryLevel?: number;
  appVersion?: string;
  osVersion?: string;
  location?: { lat: number; lng: number };
  enrolledAt: string;
  lastSync?: string;
}

/**
 * Log biometric attempt
 */
export async function logBiometricAttempt(
  participantId: string,
  attemptType: 'face' | 'fingerprint',
  success: boolean,
  deviceId: string,
  confidence?: number,
  failureReason?: string
): Promise<void> {
  const attempt: BiometricAttempt = {
    id: crypto.randomUUID(),
    participantId,
    attemptType,
    success,
    confidence,
    failureReason,
    deviceId,
    timestamp: new Date().toISOString(),
  };

  localStorage.setItem(`biometric_attempt_${attempt.id}`, JSON.stringify(attempt));

  // Alert if success rate dropping below 80%
  const report = await getBiometricSuccessReport('last7days');
  if (!report.meetsThreshold) {
    await alertBiometricIssue(report);
  }
}

/**
 * Get biometric success report
 */
export async function getBiometricSuccessReport(period: string): Promise<BiometricSuccessReport> {
  const attempts = await getAllAttempts();

  const filteredAttempts = filterByPeriod(attempts, period);

  const totalAttempts = filteredAttempts.length;
  const successfulAttempts = filteredAttempts.filter((a) => a.success).length;
  const failedAttempts = totalAttempts - successfulAttempts;
  const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;

  const faceAttempts = filteredAttempts.filter((a) => a.attemptType === 'face');
  const fingerprintAttempts = filteredAttempts.filter((a) => a.attemptType === 'fingerprint');

  return {
    period,
    totalAttempts,
    successfulAttempts,
    failedAttempts,
    successRate,
    byType: {
      face: {
        total: faceAttempts.length,
        successful: faceAttempts.filter((a) => a.success).length,
        rate: faceAttempts.length > 0 ? (faceAttempts.filter((a) => a.success).length / faceAttempts.length) * 100 : 0,
      },
      fingerprint: {
        total: fingerprintAttempts.length,
        successful: fingerprintAttempts.filter((a) => a.success).length,
        rate: fingerprintAttempts.length > 0 ? (fingerprintAttempts.filter((a) => a.success).length / fingerprintAttempts.length) * 100 : 0,
      },
    },
    meetsThreshold: successRate >= 80,
  };
}

/**
 * Register device
 */
export async function registerDevice(device: Omit<Device, 'id' | 'enrolledAt'>): Promise<string> {
  const id = crypto.randomUUID();
  const newDevice: Device = {
    ...device,
    id,
    enrolledAt: new Date().toISOString(),
  };

  localStorage.setItem(`device_${id}`, JSON.stringify(newDevice));
  return id;
}

/**
 * Update device location and status
 */
export async function updateDeviceStatus(
  deviceId: string,
  updates: Partial<Device>
): Promise<void> {
  const device = await getDevice(deviceId);
  if (!device) throw new Error('Device not found');

  const updated = { ...device, ...updates, lastSeen: new Date().toISOString() };
  localStorage.setItem(`device_${deviceId}`, JSON.stringify(updated));
}

/**
 * Report device lost
 */
export async function reportDeviceLost(deviceId: string, reportedBy: string): Promise<void> {
  await updateDeviceStatus(deviceId, { status: 'lost' });

  const managers = await db.users.where('role').equals('project-manager').toArray();
  for (const manager of managers) {
    await db.notifications.add({
      id: crypto.randomUUID(),
      userId: manager.id,
      type: 'general',
      title: 'Device Reported Lost',
      message: `Device ${deviceId} has been reported as lost`,
      metadata: { deviceId, reportedBy },
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
}

async function getAllAttempts(): Promise<BiometricAttempt[]> {
  const attempts: BiometricAttempt[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('biometric_attempt_')) {
      const data = localStorage.getItem(key);
      if (data) attempts.push(JSON.parse(data));
    }
  }
  return attempts.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

async function getDevice(id: string): Promise<Device | null> {
  const data = localStorage.getItem(`device_${id}`);
  return data ? JSON.parse(data) : null;
}

function filterByPeriod(attempts: BiometricAttempt[], period: string): BiometricAttempt[] {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'last7days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'last30days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(0);
  }

  return attempts.filter((a) => new Date(a.timestamp) >= startDate);
}

async function alertBiometricIssue(report: BiometricSuccessReport): Promise<void> {
  const managers = await db.users.where('role').equals('project-manager').toArray();
  for (const manager of managers) {
    await db.notifications.add({
      id: crypto.randomUUID(),
      userId: manager.id,
      type: 'general',
      title: 'Biometric Success Rate Below Threshold',
      message: `Current success rate: ${report.successRate.toFixed(1)}% (target: 80%)`,
      metadata: { report },
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
}
