/**
 * Work Schedules, PPE Tracking, Incident Reporting
 *
 * Comprehensive operational management
 */

import { db } from '@/utils/db';

export interface WorkSchedule {
  id: string;
  siteId: string;
  participantId: string;
  dayOfWeek: number; // 0-6
  startTime: string;
  endTime: string;
  breakDuration: number; // minutes
  active: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdBy: string;
  createdAt: string;
}

export interface PPEItem {
  id: string;
  type: string; // 'helmet', 'gloves', 'boots', 'vest', 'goggles'
  brand: string;
  serialNumber?: string;
  condition: 'new' | 'good' | 'fair' | 'poor' | 'damaged';
  issuedTo?: string; // participantId
  issuedDate?: string;
  returnDate?: string;
  lastInspection?: string;
  nextInspection?: string;
  status: 'available' | 'issued' | 'maintenance' | 'retired';
  siteId: string;
  createdAt: string;
}

export interface IncidentReport {
  id: string;
  type: 'accident' | 'near-miss' | 'property-damage' | 'safety-violation' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: string;
  siteId?: string;
  participantsInvolved: string[];
  witnesses: string[];
  injuries?: {
    participant: string;
    injuryType: string;
    treatmentRequired: boolean;
    hospitalRequired: boolean;
  }[];
  photos: string[];
  reportedBy: string;
  reportedAt: string;
  investigatedBy?: string;
  investigation?: {
    findings: string;
    rootCause: string;
    correctiveActions: string[];
    preventiveMeasures: string[];
    completedAt: string;
  };
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  closedAt?: string;
  createdAt: string;
}

export async function createWorkSchedule(schedule: Omit<WorkSchedule, 'id' | 'createdAt'>): Promise<string> {
  const id = crypto.randomUUID();
  const newSchedule: WorkSchedule = {
    ...schedule,
    id,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(`schedule_${id}`, JSON.stringify(newSchedule));
  return id;
}

export async function issuePPE(participantId: string, ppeItemId: string, issuedBy: string): Promise<void> {
  const item = await getPPEItem(ppeItemId);
  if (!item) throw new Error('PPE item not found');
  if (item.status !== 'available') throw new Error('PPE item not available');

  item.issuedTo = participantId;
  item.issuedDate = new Date().toISOString();
  item.status = 'issued';

  localStorage.setItem(`ppe_${ppeItemId}`, JSON.stringify(item));
}

export async function reportIncident(report: Omit<IncidentReport, 'id' | 'createdAt' | 'status'>): Promise<string> {
  const id = crypto.randomUUID();
  const incident: IncidentReport = {
    ...report,
    id,
    status: 'reported',
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(`incident_${id}`, JSON.stringify(incident));

  // Notify supervisors for high/critical incidents
  if (incident.severity === 'high' || incident.severity === 'critical') {
    const supervisors = await db.users.where('role').equals('supervisor').toArray();
    for (const supervisor of supervisors) {
      await db.notifications.add({
        id: crypto.randomUUID(),
        userId: supervisor.id,
        type: 'general',
        title: `${incident.severity.toUpperCase()} Incident Reported`,
        message: incident.title,
        metadata: { incidentId: id },
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return id;
}

async function getPPEItem(id: string): Promise<PPEItem | null> {
  const data = localStorage.getItem(`ppe_${id}`);
  return data ? JSON.parse(data) : null;
}
