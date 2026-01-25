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
  fullName: string; // Computed: firstName + lastName
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
  siteName?: string; // Display name for the site
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
  checkInTime?: string;
  checkInMethod?: 'face' | 'fingerprint';
  checkInBiometricConfidence?: number;
  biometricConfidence?: number; // Alias for checkInBiometricConfidence
  checkInGPS?: {
    lat: number;
    lng: number;
  };
  checkInLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  checkInPhotoUrl?: string;
  checkInPhoto?: string; // Base64 photo data

  // Check-out
  checkOutTime?: string;
  checkOutMethod?: 'face' | 'fingerprint';
  checkOutBiometricConfidence?: number;
  checkOutGPS?: {
    lat: number;
    lng: number;
  };
  checkOutLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  checkOutPhotoUrl?: string;
  checkOutPhoto?: string; // Base64 photo data

  // Status
  status?: 'present' | 'absent' | 'late' | 'excused';

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

// ========================================
// IDC SEF-GRADE ONBOARDING SYSTEM
// ========================================

// Candidate - System of record for onboarding
export interface Candidate {
  id: string;
  fullName: string;
  saIdNumber: string;
  dateOfBirth: string;
  email?: string;
  phoneNumber?: string;
  address?: string;

  // Status tracking
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DOCUMENTS_UPLOADED' | 'PROCESSING' | 'AWAITING_CONFIRMATION' | 'VERIFIED' | 'SYNC_READY' | 'FAILED';

  // POPIA compliance (HARD GATE)
  popiaConsentGiven: boolean;
  popiaConsentDate?: string;
  popiaConsentSignature?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Onboarding session - Tracks 6-response contract
export interface OnboardingSession {
  id: string;
  candidateId: string;

  // State machine
  state: 'NOT_STARTED' | 'IN_PROGRESS' | 'DOCUMENTS_UPLOADED' | 'PROCESSING' | 'AWAITING_CONFIRMATION' | 'VERIFIED' | 'SYNC_READY' | 'FAILED';

  // Response tracking (MAX 6)
  responseCount: number; // Hard limit: max 6
  locked: boolean; // When true, no further responses allowed

  // Session metadata
  startedAt?: string;
  completedAt?: string;
  lockedAt?: string;
  lockReason?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Document types (NON-NEGOTIABLE)
export type OnboardingDocumentType =
  | 'certified-sa-id'
  | 'police-affidavit'
  | 'proof-of-bank-account'
  | 'proof-of-address'
  | 'application-form'
  | 'cv'
  | 'popia-consent';

// Document with extraction capability
export interface OnboardingDocument {
  id: string;
  candidateId: string;
  documentType: OnboardingDocumentType;

  // File info
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;

  // Processing status
  status: 'PENDING' | 'PROCESSING' | 'VALID' | 'FAILED' | 'REQUIRES_REUPLOAD';

  // Extraction results
  confidenceScore?: number;
  extractedAt?: string;
  processingError?: string;

  // Audit trail
  uploadedAt: string;
  uploadedBy?: string;
  uploadedVia: 'PWA' | 'WHATSAPP';

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Extracted field with confidence scoring
export interface ExtractedField {
  id: string;
  documentId: string;
  candidateId: string;

  // Field data
  fieldName: string;
  value: string;
  confidence: number; // 0-1

  // Validation
  validationStatus: 'PENDING' | 'VALID' | 'INVALID' | 'NEEDS_REVIEW';
  validationReason?: string;

  // Cross-document validation flags
  conflictsWith?: string[]; // IDs of other fields with conflicting values
  confirmedBy?: 'CANDIDATE' | 'ADMIN' | 'AUTO';
  confirmedAt?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Checklist item types
export type ChecklistItemType =
  | 'IDENTITY_CONFIRMED'
  | 'POPIA_CONSENT'
  | 'DOC_CERTIFIED_ID'
  | 'DOC_POLICE_AFFIDAVIT'
  | 'DOC_BANK_PROOF'
  | 'DOC_ADDRESS_PROOF'
  | 'DOC_APPLICATION_FORM'
  | 'DOC_CV'
  | 'DATA_PERSONAL_CONFIRMED'
  | 'DATA_BANK_CONFIRMED'
  | 'DATA_ADDRESS_CONFIRMED'
  | 'DATA_APPLICATION_CONFIRMED'
  | 'FINAL_DECLARATION';

// Checklist item for tracking completion
export interface ChecklistItem {
  id: string;
  candidateId: string;
  itemType: ChecklistItemType;

  // Completion tracking
  completed: boolean;
  completedAt?: string;
  completedBy?: string;

  // Validation
  validationStatus: 'PENDING' | 'VALID' | 'INVALID';
  validationNotes?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Payroll sync record (Kwantu is read-only payroll authority)
export interface PayrollSync {
  id: string;
  candidateId: string;

  // Sync status
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

  // Authorization (REQUIRED)
  authorizedBy: string; // User ID who authorized sync
  authorizedAt: string;
  authorizationReason: string;

  // Sync details
  syncedAt?: string;
  syncError?: string;
  kwantuRecordId?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Audit log (IMMUTABLE)
export interface OnboardingAuditLog {
  id: string;

  // Entity being audited
  entityType: 'CANDIDATE' | 'SESSION' | 'DOCUMENT' | 'FIELD' | 'CHECKLIST' | 'PAYROLL';
  entityId: string;

  // Action taken
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'STATE_TRANSITION' | 'OVERRIDE' | 'AUTHORIZATION' | 'REJECTION';

  // Actor
  actor: string; // User ID or 'SYSTEM'
  actorRole?: UserRole;

  // State changes
  previousState?: any;
  newState?: any;

  // Reason (REQUIRED for overrides and rejections)
  reasonCode?: string;
  reasonDescription?: string;

  // Context
  ipAddressHash?: string;
  deviceInfo?: string;
  sessionId?: string;

  // Timestamp (IMMUTABLE)
  timestamp: string;
}

// Document extraction result contract
export interface DocumentExtractionResult {
  extractedFields: Array<{
    fieldName: string;
    value: string;
    confidence: number;
  }>;
  confidenceScores: Record<string, number>;
  flags: string[]; // Issues or warnings
  pageCount: number;
  rawText?: string;
  processingTimeMs: number;
}

// Onboarding state machine events
export type OnboardingEvent =
  | 'OnboardingStarted'
  | 'DocumentsUploaded'
  | 'ExtractionCompleted'
  | 'ValidationFailed'
  | 'ConfirmationCompleted'
  | 'OnboardingVerified'
  | 'PayrollSyncAuthorized'
  | 'SessionLocked'
  | 'OverrideApplied';

// Event payload
export interface OnboardingEventPayload {
  event: OnboardingEvent;
  candidateId: string;
  sessionId: string;
  timestamp: string;
  data?: Record<string, any>;
  actor?: string;
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
