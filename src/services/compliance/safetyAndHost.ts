/**
 * Host Organization Onboarding & Health & Safety Protocols
 */

import { db } from '@/utils/db';

export interface HostOrganization {
  id: string;
  name: string;
  registrationNumber: string;
  industry: string;
  address: string;
  contactPerson: {
    name: string;
    title: string;
    email: string;
    phone: string;
  };
  complianceDocuments: {
    type: string;
    fileUrl: string;
    expiryDate?: string;
    verified: boolean;
  }[];
  safetyOfficer: {
    name: string;
    certification: string;
    phone: string;
  };
  status: 'pending' | 'approved' | 'suspended' | 'terminated';
  onboardedAt: string;
  approvedBy?: string;
}

export interface SafetyProtocol {
  id: string;
  siteId: string;
  title: string;
  category: 'ppe' | 'emergency' | 'hazard' | 'procedure' | 'general';
  description: string;
  requirements: string[];
  emergencyContacts: {
    name: string;
    role: string;
    phone: string;
  }[];
  lastReviewedAt?: string;
  nextReviewDate?: string;
  mandatory: boolean;
  acknowledgmentRequired: boolean;
  createdAt: string;
}

export interface SafetyTraining {
  id: string;
  participantId: string;
  protocolId: string;
  completedAt: string;
  trainedBy: string;
  expiresAt?: string;
  certificateIssued: boolean;
  score?: number;
}

/**
 * Onboard host organization
 */
export async function onboardHostOrganization(
  org: Omit<HostOrganization, 'id' | 'onboardedAt' | 'status'>
): Promise<string> {
  const id = crypto.randomUUID();
  const newOrg: HostOrganization = {
    ...org,
    id,
    status: 'pending',
    onboardedAt: new Date().toISOString(),
  };

  localStorage.setItem(`host_org_${id}`, JSON.stringify(newOrg));

  // Notify admins for approval
  const admins = await db.users.where('role').equals('project-manager').toArray();
  for (const admin of admins) {
    await db.notifications.add({
      id: crypto.randomUUID(),
      userId: admin.id,
      type: 'general',
      title: 'New Host Organization Pending Approval',
      message: `${org.name} has been submitted for approval`,
      metadata: { hostOrgId: id },
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  return id;
}

/**
 * Create safety protocol
 */
export async function createSafetyProtocol(
  protocol: Omit<SafetyProtocol, 'id' | 'createdAt'>
): Promise<string> {
  const id = crypto.randomUUID();
  const newProtocol: SafetyProtocol = {
    ...protocol,
    id,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(`safety_protocol_${id}`, JSON.stringify(newProtocol));

  return id;
}

/**
 * Record safety training completion
 */
export async function recordSafetyTraining(
  training: Omit<SafetyTraining, 'id'>
): Promise<void> {
  const id = crypto.randomUUID();
  const record: SafetyTraining = { ...training, id };

  localStorage.setItem(`safety_training_${id}`, JSON.stringify(record));

  // Notify participant
  const participant = await db.participants.get(training.participantId);
  if (participant) {
    await db.notifications.add({
      id: crypto.randomUUID(),
      userId: participant.userId,
      type: 'general',
      title: 'Safety Training Completed',
      message: training.certificateIssued
        ? 'Your safety training certificate has been issued'
        : 'Safety training recorded',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
}

/**
 * Get all safety protocols for a site
 */
export async function getSafetyProtocols(siteId: string): Promise<SafetyProtocol[]> {
  const protocols: SafetyProtocol[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('safety_protocol_')) {
      const data = localStorage.getItem(key);
      if (data) {
        const protocol = JSON.parse(data);
        if (protocol.siteId === siteId) {
          protocols.push(protocol);
        }
      }
    }
  }

  return protocols;
}
