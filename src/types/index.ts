// User roles in the system
export type UserRole = 'worker' | 'supervisor' | 'project-manager' | 'property-point' | 'idc';

// User authentication
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

// Participant (Programme participant/worker)
export interface Participant {
  id: string;
  userId: string;
  idNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;

  // Onboarding status
  onboardingStatus: 'pending' | 'in-progress' | 'completed' | 'verified' | 'rejected';
  onboardingStep: number;

  // Documents
  documents: ParticipantDocument[];

  // Biometric data (stored as hashed templates)
  biometricEnrolled: boolean;
  faceTemplateHash?: string;
  fingerprintTemplateHash?: string;

  // Compliance
  popiaConsentGiven: boolean;
  popiaConsentDate?: string;
  popiaConsentSignature?: string;
  taxNumber?: string;

  // Employment
  siteId?: string;
  supervisorId?: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'inactive' | 'suspended' | 'exited';

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Document types required for onboarding
export type DocumentType =
  | 'sa-id'
  | 'employment-contract'
  | 'bank-confirmation'
  | 'affidavit'
  | 'popia-consent'
  | 'tax-number';

export interface ParticipantDocument {
  id: string;
  participantId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;

  // Verification
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'requires-reupload';
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;

  // OCR and AI validation
  ocrData?: Record<string, any>;
  qualityScore?: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Site/Facility
export interface Site {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  hostPartner: string;
  siteType: 'office' | 'factory' | 'field' | 'warehouse';

  // Contact
  supervisorName: string;
  supervisorPhone: string;
  supervisorEmail: string;

  // Safety
  requiredPPE: string[];
  safetyProtocols: string;
  emergencyContacts: EmergencyContact[];

  // Participants
  participantIds: string[];
  maxCapacity: number;

  // Status
  status: 'active' | 'inactive' | 'maintenance';

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
}

// Attendance
export interface AttendanceRecord {
  id: string;
  participantId: string;
  siteId: string;
  date: string;

  // Check-in
  checkInTime: string;
  checkInMethod: 'face' | 'fingerprint';
  checkInBiometricConfidence: number;
  checkInGPS: {
    lat: number;
    lng: number;
  };
  checkInPhotoUrl: string;

  // Check-out
  checkOutTime?: string;
  checkOutMethod?: 'face' | 'fingerprint';
  checkOutBiometricConfidence?: number;
  checkOutGPS?: {
    lat: number;
    lng: number;
  };
  checkOutPhotoUrl?: string;

  // Duration
  duration?: number; // in minutes

  // Sync status
  syncStatus: 'pending' | 'synced' | 'failed';
  syncedAt?: string;
  syncError?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Task
export interface Task {
  id: string;
  title: string;
  description: string;
  siteId: string;
  siteName?: string; // Display name for the site
  assignedToId: string;
  assignedToName?: string; // Display name for assigned worker
  assignedById: string;
  assignedByName?: string; // Display name for supervisor who assigned

  // Scheduling
  dueDate: string;
  estimatedDuration?: number; // in minutes

  // Location
  locationDescription?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Requirements
  requiresPhotoEvidence: boolean;
  minimumPhotos?: number;

  // Priority
  priority: 'low' | 'medium' | 'high' | 'urgent';

  // Status
  status: 'pending' | 'in-progress' | 'completed' | 'approved' | 'rejected' | 'requires-changes';

  // Completion
  completedAt?: string;
  completedByName?: string; // Display name for who completed the task
  actualDuration?: number;
  proofPhotos: string[];
  completionNote?: string;

  // Review
  reviewedById?: string;
  reviewedAt?: string;
  supervisorFeedback?: string; // Alias for reviewFeedback
  qualityRating?: number; // 1-5 stars

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// M&E Report
export interface MEReport {
  id: string;
  reportType: 'attendance' | 'compliance' | 'training' | 'work-output' | 'custom';
  title: string;
  description?: string;

  // Date range
  startDate: string;
  endDate: string;

  // Filters
  siteIds?: string[];
  participantIds?: string[];

  // Data
  data: Record<string, any>;

  // Export
  generatedAt: string;
  generatedBy: string;
  format: 'excel' | 'pdf' | 'csv';
  fileUrl?: string;

  // Scheduling
  isScheduled: boolean;
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly';
  scheduleDay?: number;
  recipientEmails?: string[];

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Kwantu Sync
export interface KwantuSyncRecord {
  id: string;
  recordType: 'participant' | 'attendance' | 'payroll' | 'me-report';
  recordId: string;

  // Sync status
  status: 'pending' | 'synced' | 'failed';
  attempts: number;
  lastAttemptAt?: string;
  syncedAt?: string;

  // Error handling
  error?: string;
  errorDetails?: string;

  // Payload
  payload: Record<string, any>;
  response?: Record<string, any>;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Audit log
export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userRole: UserRole;

  // Action
  action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'reject';
  resource: string;
  resourceId: string;

  // Changes
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };

  // Context
  ipAddressHash: string;
  deviceInfo: string;
  reason?: string;

  // Metadata
  createdAt: string;
}

// Communication/Story
export interface ImpactStory {
  id: string;
  participantId: string;
  participantConsentGiven: boolean;

  // Content
  title: string;
  narrative: string;
  quote?: string;

  // Media
  photos: string[];
  videos?: string[];

  // Metadata
  tags: string[];
  workType?: string;
  skills?: string[];
  siteId?: string;
  milestone?: string;

  // Metrics
  tasksCompleted?: number;
  skillsGained?: string[];
  durationMonths?: number;

  // Publishing
  status: 'draft' | 'review' | 'approved' | 'published';
  reviewedBy?: string;
  reviewedAt?: string;
  publishedAt?: string;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Notification
export interface Notification {
  id: string;
  userId: string;

  // Content
  title: string;
  message: string;
  icon?: string;

  // Type
  type: 'task-assigned' | 'task-approved' | 'check-in-reminder' | 'document-pending' | 'compliance-issue' | 'general';

  // Action
  actionUrl?: string;
  actionLabel?: string;

  // Status
  read: boolean;
  readAt?: string;

  // Metadata
  createdAt: string;
}

// App state
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Offline status
  isOnline: boolean;
  pendingSyncCount: number;

  // PWA
  isPWAInstalled: boolean;
  showInstallPrompt: boolean;
}
