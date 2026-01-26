import Dexie, { Table } from 'dexie';
import type {
  Participant,
  AttendanceRecord,
  Site,
  Task,
  ParticipantDocument,
  KwantuSyncRecord,
  AuditLog,
  Notification,
  OnboardingSession,
  ExtractedField,
  ChecklistItem,
  PayrollSync,
  ImpactStory,
} from '@/types';

export class ItsonFSMDatabase extends Dexie {
  participants!: Table<Participant, string>;
  attendanceRecords!: Table<AttendanceRecord, string>;
  sites!: Table<Site, string>;
  tasks!: Table<Task, string>;
  documents!: Table<ParticipantDocument, string>;
  kwantuSyncRecords!: Table<KwantuSyncRecord, string>;
  auditLogs!: Table<AuditLog, string>;
  notifications!: Table<Notification, string>;
  onboardingSessions!: Table<OnboardingSession, string>;
  extractedFields!: Table<ExtractedField, string>;
  checklistItems!: Table<ChecklistItem, string>;
  payrollSyncs!: Table<PayrollSync, string>;
  impactStories!: Table<ImpactStory, string>;

  constructor() {
    super('ItsonFSMDatabase');

    // Version 1: Original schema
    this.version(1).stores({
      participants: 'id, userId, idNumber, onboardingStatus, status, siteId, createdAt',
      attendanceRecords: 'id, participantId, siteId, date, syncStatus, createdAt',
      sites: 'id, name, status, createdAt',
      tasks: 'id, siteId, assignedToId, assignedById, status, priority, dueDate, createdAt',
      documents: 'id, participantId, type, verificationStatus, createdAt',
      kwantuSyncRecords: 'id, recordType, recordId, status, createdAt',
      auditLogs: 'id, userId, resource, resourceId, timestamp',
      notifications: 'id, userId, type, read, [userId+read], createdAt',
    });

    // Version 2: Add comprehensive onboarding system
    this.version(2).stores({
      participants: 'id, userId, idNumber, onboardingStatus, status, siteId, createdAt',
      attendanceRecords: 'id, participantId, siteId, date, syncStatus, createdAt',
      sites: 'id, name, status, createdAt',
      tasks: 'id, siteId, assignedToId, assignedById, status, priority, dueDate, createdAt',
      documents: 'id, participantId, candidateId, type, verificationStatus, status, createdAt',
      kwantuSyncRecords: 'id, recordType, recordId, status, createdAt',
      auditLogs: 'id, userId, entityType, entityId, action, timestamp',
      notifications: 'id, userId, type, read, [userId+read], createdAt',
      onboardingSessions: 'id, candidateId, state, locked, createdAt',
      extractedFields: 'id, documentId, candidateId, fieldName, createdAt',
      checklistItems: 'id, candidateId, itemType, completed, createdAt',
      payrollSyncs: 'id, candidateId, syncStatus, createdAt',
    });

    // Version 3: Add impact stories
    this.version(3).stores({
      participants: 'id, userId, idNumber, onboardingStatus, status, siteId, createdAt',
      attendanceRecords: 'id, participantId, siteId, date, syncStatus, createdAt',
      sites: 'id, name, status, createdAt',
      tasks: 'id, siteId, assignedToId, assignedById, status, priority, dueDate, createdAt',
      documents: 'id, participantId, candidateId, type, verificationStatus, status, createdAt',
      kwantuSyncRecords: 'id, recordType, recordId, status, createdAt',
      auditLogs: 'id, userId, entityType, entityId, action, timestamp',
      notifications: 'id, userId, type, read, [userId+read], createdAt',
      onboardingSessions: 'id, candidateId, state, locked, createdAt',
      extractedFields: 'id, documentId, candidateId, fieldName, createdAt',
      checklistItems: 'id, candidateId, itemType, completed, createdAt',
      payrollSyncs: 'id, candidateId, syncStatus, createdAt',
      impactStories: 'id, participantId, status, createdBy, createdAt, publishedAt',
    });
  }
}

export const db = new ItsonFSMDatabase();

// Database utilities
export const dbUtils = {
  // Attendance
  async addAttendanceRecord(record: AttendanceRecord): Promise<string> {
    return await db.attendanceRecords.add(record);
  },

  async getAttendanceByParticipant(
    participantId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceRecord[]> {
    let query = db.attendanceRecords.where('participantId').equals(participantId);

    if (startDate && endDate) {
      return (await query.toArray()).filter(
        (record) => record.date >= startDate && record.date <= endDate
      );
    }

    return await query.toArray();
  },

  async getPendingSyncRecords(): Promise<AttendanceRecord[]> {
    return await db.attendanceRecords.where('syncStatus').equals('pending').toArray();
  },

  async updateSyncStatus(id: string, status: 'synced' | 'failed', error?: string): Promise<void> {
    await db.attendanceRecords.update(id, {
      syncStatus: status,
      syncedAt: status === 'synced' ? new Date().toISOString() : undefined,
      syncError: error,
      updatedAt: new Date().toISOString(),
    });
  },

  // Tasks
  async getTasksByAssignee(assignedToId: string, status?: string): Promise<Task[]> {
    let query = db.tasks.where('assignedToId').equals(assignedToId);

    if (status) {
      return (await query.toArray()).filter((task) => task.status === status);
    }

    return await query.toArray();
  },

  async getTasksBySite(siteId: string): Promise<Task[]> {
    return await db.tasks.where('siteId').equals(siteId).toArray();
  },

  async updateTaskStatus(
    id: string,
    status: Task['status'],
    additionalData?: Partial<Task>
  ): Promise<void> {
    await db.tasks.update(id, {
      status,
      ...additionalData,
      updatedAt: new Date().toISOString(),
    });
  },

  // Sites
  async getSiteById(id: string): Promise<Site | undefined> {
    return await db.sites.get(id);
  },

  async getAllActiveSites(): Promise<Site[]> {
    return await db.sites.where('status').equals('active').toArray();
  },

  // Participants
  async getParticipantById(id: string): Promise<Participant | undefined> {
    return await db.participants.get(id);
  },

  async getParticipantsBySite(siteId: string): Promise<Participant[]> {
    return await db.participants.where('siteId').equals(siteId).toArray();
  },

  async updateParticipantOnboardingStatus(
    id: string,
    status: Participant['onboardingStatus'],
    step: number
  ): Promise<void> {
    await db.participants.update(id, {
      onboardingStatus: status,
      onboardingStep: step,
      updatedAt: new Date().toISOString(),
    });
  },

  // Documents
  async getDocumentsByParticipant(participantId: string): Promise<ParticipantDocument[]> {
    return await db.documents.where('participantId').equals(participantId).toArray();
  },

  async getPendingDocuments(): Promise<ParticipantDocument[]> {
    return await db.documents.where('verificationStatus').equals('pending').toArray();
  },

  async updateDocumentVerification(
    id: string,
    status: ParticipantDocument['verificationStatus'],
    verifiedBy?: string,
    rejectionReason?: string
  ): Promise<void> {
    await db.documents.update(id, {
      verificationStatus: status,
      verifiedBy,
      verifiedAt: new Date().toISOString(),
      rejectionReason,
      updatedAt: new Date().toISOString(),
    });
  },

  // Kwantu sync
  async addToSyncQueue(record: KwantuSyncRecord): Promise<string> {
    return await db.kwantuSyncRecords.add(record);
  },

  async getPendingSyncQueue(): Promise<KwantuSyncRecord[]> {
    return await db.kwantuSyncRecords.where('status').equals('pending').toArray();
  },

  // Audit logs
  async addAuditLog(log: AuditLog): Promise<string> {
    return await db.auditLogs.add(log);
  },

  async getAuditLogs(filters?: {
    userId?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLog[]> {
    let logs = await db.auditLogs.toArray();

    if (filters) {
      if (filters.userId) {
        logs = logs.filter((log) => log.userId === filters.userId);
      }
      if (filters.resource) {
        logs = logs.filter((log) => log.resource === filters.resource);
      }
      if (filters.startDate && filters.endDate) {
        logs = logs.filter(
          (log) => log.timestamp >= filters.startDate! && log.timestamp <= filters.endDate!
        );
      }
    }

    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  // Notifications
  async addNotification(notification: Notification): Promise<string> {
    return await db.notifications.add(notification);
  },

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const allNotifications = await db.notifications
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt');

    return allNotifications.filter(notification => !notification.read);
  },

  async markNotificationAsRead(id: string): Promise<void> {
    await db.notifications.update(id, {
      read: true,
      readAt: new Date().toISOString(),
    });
  },

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const allNotifications = await db.notifications
      .where('userId')
      .equals(userId)
      .toArray();

    const unreadNotifications = allNotifications.filter(notification => !notification.read);

    await Promise.all(
      unreadNotifications.map((notification) =>
        db.notifications.update(notification.id, {
          read: true,
          readAt: new Date().toISOString(),
        })
      )
    );
  },

  // Impact Stories
  async addImpactStory(story: ImpactStory): Promise<string> {
    return await db.impactStories.add(story);
  },

  async getImpactStoriesByParticipant(participantId: string): Promise<ImpactStory[]> {
    return await db.impactStories
      .where('participantId')
      .equals(participantId)
      .reverse()
      .sortBy('createdAt');
  },

  async getImpactStoriesByStatus(status: ImpactStory['status']): Promise<ImpactStory[]> {
    return await db.impactStories
      .where('status')
      .equals(status)
      .reverse()
      .sortBy('createdAt');
  },

  async getPublishedImpactStories(): Promise<ImpactStory[]> {
    return await db.impactStories
      .where('status')
      .equals('published')
      .reverse()
      .sortBy('publishedAt');
  },

  async updateImpactStoryStatus(
    id: string,
    status: ImpactStory['status'],
    reviewedBy?: string
  ): Promise<void> {
    const updateData: Partial<ImpactStory> = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'approved' || status === 'published') {
      updateData.reviewedBy = reviewedBy;
      updateData.reviewedAt = new Date().toISOString();
    }

    if (status === 'published') {
      updateData.publishedAt = new Date().toISOString();
    }

    await db.impactStories.update(id, updateData);
  },

  async updateImpactStory(id: string, data: Partial<ImpactStory>): Promise<void> {
    await db.impactStories.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteImpactStory(id: string): Promise<void> {
    await db.impactStories.delete(id);
  },

  // Clear all data (for logout/reset)
  async clearAllData(): Promise<void> {
    await Promise.all([
      db.participants.clear(),
      db.attendanceRecords.clear(),
      db.sites.clear(),
      db.tasks.clear(),
      db.documents.clear(),
      db.kwantuSyncRecords.clear(),
      db.auditLogs.clear(),
      db.notifications.clear(),
      db.impactStories.clear(),
    ]);
  },
};
