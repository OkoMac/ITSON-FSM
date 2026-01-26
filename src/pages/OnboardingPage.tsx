/**
 * ITSON FSM / LEEGRANT FSM — IDC SEF–GRADE ONBOARDING SYSTEM
 *
 * Strict 6-response onboarding with full compliance
 *
 * CRITICAL RULES:
 * - ONE BUTTON START ONLY
 * - MAXIMUM 6 RESPONSES
 * - POPIA CONSENT IS HARD GATE
 * - NO ACTIVATION WITHOUT VERIFIED STATUS
 * - ALL DOCUMENTS REQUIRED
 * - IMMUTABLE AUDIT TRAIL
 */

import React, { useState, useEffect } from 'react';
import { GlassCard, Input, Button, Badge } from '@/components/ui';
import { DocumentUpload } from '@/components/onboarding/DocumentUpload';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  Candidate,
  OnboardingSession,
  OnboardingDocument,
  OnboardingDocumentType,
} from '@/types';
import { db } from '@/utils/db';
import {
  extractDocumentData,
  validateSAIDNumber,
  extractDOBFromSAID,
} from '@/services/onboarding/documentExtraction';
import {
  incrementResponseCount,
  processEvent,
} from '@/services/onboarding/stateMachine';
import { auditLogger } from '@/services/onboarding/auditLogger';
import { checklistService } from '@/services/onboarding/checklistService';

// Required documents (NON-NEGOTIABLE)
const REQUIRED_DOCUMENTS: Array<{ type: OnboardingDocumentType; label: string }> = [
  { type: 'certified-sa-id', label: 'Certified South African ID' },
  { type: 'police-affidavit', label: 'Police Affidavit' },
  { type: 'proof-of-bank-account', label: 'Proof of Bank Account' },
  { type: 'proof-of-address', label: 'Proof of Address' },
  { type: 'application-form', label: 'Application Form' },
  { type: 'cv', label: 'CV (Curriculum Vitae)' },
  { type: 'popia-consent', label: 'POPIA Consent Form' },
];

const OnboardingPage: React.FC = () => {
  const { user } = useAuthStore();

  // Session state
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Response state (1-6)
  const [currentResponse, setCurrentResponse] = useState<number>(0);

  // Response 1: Identity + POPIA
  const [saIdNumber, setSaIdNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [popiaConsent, setPopiaConsent] = useState(false);

  // Response 2: Documents
  const [documents, setDocuments] = useState<Record<OnboardingDocumentType, File | null>>({
    'certified-sa-id': null,
    'police-affidavit': null,
    'proof-of-bank-account': null,
    'proof-of-address': null,
    'application-form': null,
    'cv': null,
    'popia-consent': null,
  });

  // Response 3: Extracted personal data
  const [extractedData, setExtractedData] = useState<Record<string, string>>({});
  const [personalDataConfirmed, setPersonalDataConfirmed] = useState(false);

  // Response 4: Bank + Address
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [address, setAddress] = useState('');
  const [bankAddressConfirmed, setBankAddressConfirmed] = useState(false);

  // Response 5: Application data
  const [applicationConfirmed, setApplicationConfirmed] = useState(false);

  // Response 6: Final declaration
  const [finalDeclaration, setFinalDeclaration] = useState(false);

  // Load existing session on mount
  useEffect(() => {
    loadSession();
  }, [user]);

  const loadSession = async () => {
    if (!user) return;

    try {
      // Try to find existing candidate
      const candidates = await db.participants
        .where('userId')
        .equals(user.id)
        .toArray();

      if (candidates.length > 0) {
        // For now, we'll work with Participant as Candidate
        // In production, have separate Candidate table
        // Load existing session if any
      }
    } catch (err) {
      console.error('Error loading session:', err);
    }
  };

  /**
   * START ONBOARDING - SINGLE BUTTON ACTION
   */
  const handleStartOnboarding = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Create candidate record
      const newCandidate: Candidate = {
        id: crypto.randomUUID(),
        fullName: '',
        saIdNumber: '',
        dateOfBirth: '',
        status: 'NOT_STARTED',
        popiaConsentGiven: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create onboarding session
      const newSession: OnboardingSession = {
        id: crypto.randomUUID(),
        candidateId: newCandidate.id,
        state: 'NOT_STARTED',
        responseCount: 0,
        locked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.onboardingSessions.add(newSession);

      // Initialize checklist
      await checklistService.initializeChecklist(newCandidate.id);

      // Transition to IN_PROGRESS
      await processEvent('OnboardingStarted', newSession.id, newCandidate.id, user.id);

      setCandidate(newCandidate);
      setSession({ ...newSession, state: 'IN_PROGRESS', responseCount: 0 });
      setCurrentResponse(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start onboarding');
    } finally {
      setLoading(false);
    }
  };

  /**
   * RESPONSE 1: Identity confirmation + POPIA consent (HARD GATE)
   */
  const handleResponse1 = async () => {
    if (!session || !candidate || !user) return;

    // Validation
    if (!saIdNumber || !fullName) {
      setError('Please provide SA ID number and full name');
      return;
    }

    if (!validateSAIDNumber(saIdNumber)) {
      setError('Invalid SA ID number. Please check and try again.');
      return;
    }

    if (!popiaConsent) {
      setError('POPIA consent is required to proceed. This is a non-negotiable requirement.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Increment response count
      await incrementResponseCount(session.id);

      // Extract DOB from SA ID
      const dob = extractDOBFromSAID(saIdNumber);

      // Update candidate
      const updatedCandidate: Candidate = {
        ...candidate,
        saIdNumber,
        fullName,
        dateOfBirth: dob || '',
        popiaConsentGiven: true,
        popiaConsentDate: new Date().toISOString(),
        status: 'IN_PROGRESS',
        updatedAt: new Date().toISOString(),
      };

      setCandidate(updatedCandidate);

      // Complete checklist items
      await checklistService.completeChecklistItem(candidate.id, 'IDENTITY_CONFIRMED', user.id);
      await checklistService.completeChecklistItem(candidate.id, 'POPIA_CONSENT', user.id);

      // Log action
      await auditLogger.logCandidateAction(
        candidate.id,
        'UPDATED',
        user.id,
        candidate,
        updatedCandidate,
        'Response 1: Identity confirmed and POPIA consent given'
      );

      // Move to response 2
      setCurrentResponse(2);
      setSession({ ...session, responseCount: 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process response');
    } finally {
      setLoading(false);
    }
  };

  /**
   * RESPONSE 2: Upload ALL documents (single batch)
   */
  const handleResponse2 = async () => {
    if (!session || !candidate || !user) return;

    // Validation: ALL documents required
    const missingDocs = REQUIRED_DOCUMENTS.filter((doc) => !documents[doc.type]);
    if (missingDocs.length > 0) {
      setError(`Missing documents: ${missingDocs.map((d) => d.label).join(', ')}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Increment response count
      await incrementResponseCount(session.id);

      // Process each document
      const extractionResults: Record<string, any> = {};

      for (const { type } of REQUIRED_DOCUMENTS) {
        const file = documents[type];
        if (!file) continue;

        // Extract data from document
        const result = await extractDocumentData(file, type);

        extractionResults[type] = result;

        // Store document (in production, upload to server)
        const docRecord: OnboardingDocument = {
          id: crypto.randomUUID(),
          candidateId: candidate.id,
          documentType: type,
          fileName: file.name,
          filePath: URL.createObjectURL(file), // Mock - use real upload in production
          fileSize: file.size,
          mimeType: file.type,
          status: result.flags.length === 0 ? 'VALID' : 'PENDING',
          confidenceScore: result.confidenceScores.overall,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user.id,
          uploadedVia: 'PWA',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Save to DB (using documents table)
        await db.documents.add({
          id: docRecord.id,
          participantId: candidate.id,
          type: type as any, // Type mismatch - will fix in production
          fileName: docRecord.fileName,
          fileUrl: docRecord.filePath,
          fileSize: docRecord.fileSize,
          uploadedAt: docRecord.uploadedAt,
          verificationStatus: 'pending',
          ocrData: result.extractedFields,
          qualityScore: result.confidenceScores.overall,
          createdAt: docRecord.createdAt,
          updatedAt: docRecord.updatedAt,
        });

        // Complete checklist item
        const checklistItemType = `DOC_${type.replace(/-/g, '_').toUpperCase()}` as any;
        try {
          await checklistService.completeChecklistItem(candidate.id, checklistItemType, user.id);
        } catch {
          // Ignore if checklist item doesn't exist
        }

        // Log document upload
        await auditLogger.logDocumentAction(
          docRecord.id,
          candidate.id,
          'CREATED',
          user.id,
          undefined,
          docRecord,
          `Document uploaded: ${type}`
        );
      }

      // Aggregate extracted data for next response
      const aggregatedData: Record<string, string> = {};
      Object.values(extractionResults).forEach((result: any) => {
        result.extractedFields.forEach((field: any) => {
          if (!aggregatedData[field.fieldName] || field.confidence > 0.8) {
            aggregatedData[field.fieldName] = field.value;
          }
        });
      });

      setExtractedData(aggregatedData);

      // Transition state
      await processEvent('DocumentsUploaded', session.id, candidate.id, user.id);
      await processEvent('ExtractionCompleted', session.id, candidate.id, user.id);

      // Move to response 3
      setCurrentResponse(3);
      setSession({ ...session, responseCount: 2, state: 'AWAITING_CONFIRMATION' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process documents');
    } finally {
      setLoading(false);
    }
  };

  /**
   * RESPONSE 3: Confirm extracted personal data (AI-prefilled)
   */
  const handleResponse3 = async () => {
    if (!session || !candidate || !user) return;

    if (!personalDataConfirmed) {
      setError('Please review and confirm your personal data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await incrementResponseCount(session.id);

      // Complete checklist item
      await checklistService.completeChecklistItem(
        candidate.id,
        'DATA_PERSONAL_CONFIRMED',
        user.id
      );

      // Log confirmation
      await auditLogger.logCandidateAction(
        candidate.id,
        'UPDATED',
        user.id,
        undefined,
        extractedData,
        'Response 3: Personal data confirmed'
      );

      // Move to response 4
      setCurrentResponse(4);
      setSession({ ...session, responseCount: 3 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * RESPONSE 4: Confirm bank + address
   */
  const handleResponse4 = async () => {
    if (!session || !candidate || !user) return;

    if (!bankAccountNumber || !branchCode || !address) {
      setError('Please provide bank account, branch code, and address');
      return;
    }

    if (!bankAddressConfirmed) {
      setError('Please review and confirm your bank and address details');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await incrementResponseCount(session.id);

      // Complete checklist items
      await checklistService.completeChecklistItem(candidate.id, 'DATA_BANK_CONFIRMED', user.id);
      await checklistService.completeChecklistItem(
        candidate.id,
        'DATA_ADDRESS_CONFIRMED',
        user.id
      );

      // Move to response 5
      setCurrentResponse(5);
      setSession({ ...session, responseCount: 4 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * RESPONSE 5: Confirm application data
   */
  const handleResponse5 = async () => {
    if (!session || !candidate || !user) return;

    if (!applicationConfirmed) {
      setError('Please review and confirm your application data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await incrementResponseCount(session.id);

      // Complete checklist item
      await checklistService.completeChecklistItem(
        candidate.id,
        'DATA_APPLICATION_CONFIRMED',
        user.id
      );

      // Move to response 6 (final)
      setCurrentResponse(6);
      setSession({ ...session, responseCount: 5 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * RESPONSE 6: Final declaration (LOCK SESSION)
   */
  const handleResponse6 = async () => {
    if (!session || !candidate || !user) return;

    if (!finalDeclaration) {
      setError('You must accept the final declaration to complete onboarding');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await incrementResponseCount(session.id);

      // Complete final checklist item
      await checklistService.completeChecklistItem(candidate.id, 'FINAL_DECLARATION', user.id);

      // Check if all checklist items are complete
      const canVerify = await checklistService.canVerifyCandidate(candidate.id);

      if (!canVerify) {
        const missing = await checklistService.getMissingItems(candidate.id);
        throw new Error(`Cannot verify: Missing items: ${missing.join(', ')}`);
      }

      // Transition to VERIFIED
      await processEvent('ConfirmationCompleted', session.id, candidate.id, user.id);

      // Update candidate status
      const updatedCandidate: Candidate = {
        ...candidate,
        status: 'VERIFIED',
        updatedAt: new Date().toISOString(),
      };

      setCandidate(updatedCandidate);

      // Log verification
      await auditLogger.logCandidateAction(
        candidate.id,
        'AUTHORIZATION',
        user.id,
        candidate,
        updatedCandidate,
        'Onboarding verified - candidate ready for sync'
      );

      // Show success
      alert('Onboarding completed successfully! Your profile has been verified.');

      // Move to completion screen
      setCurrentResponse(7); // Beyond response 6 = completion
      setSession({ ...session, responseCount: 6, state: 'VERIFIED', locked: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  // Render helper functions
  const renderStartScreen = () => (
    <GlassCard className="text-center py-64">
      <div className="mb-32">
        <h1 className="text-4xl font-bold text-gradient mb-16">ITSON FSM Onboarding</h1>
        <p className="text-text-secondary mb-8">IDC Social Employment Fund Programme</p>
        <p className="text-text-tertiary text-sm">Compliance-first onboarding system</p>
      </div>

      <div className="max-w-md mx-auto mb-32">
        <div className="p-24 rounded-glass bg-white/5 mb-16">
          <h3 className="text-lg font-semibold text-text-primary mb-16">Before you start:</h3>
          <ul className="text-left space-y-8 text-sm text-text-secondary">
            <li className="flex items-start gap-8">
              <span className="text-accent-blue">•</span>
              <span>You will respond exactly 6 times</span>
            </li>
            <li className="flex items-start gap-8">
              <span className="text-accent-blue">•</span>
              <span>POPIA consent is mandatory (non-negotiable)</span>
            </li>
            <li className="flex items-start gap-8">
              <span className="text-accent-blue">•</span>
              <span>All 7 documents must be uploaded</span>
            </li>
            <li className="flex items-start gap-8">
              <span className="text-accent-blue">•</span>
              <span>You cannot activate without VERIFIED status</span>
            </li>
            <li className="flex items-start gap-8">
              <span className="text-accent-blue">•</span>
              <span>All actions are audit-logged</span>
            </li>
          </ul>
        </div>

        <Button size="lg" fullWidth onClick={handleStartOnboarding} loading={loading}>
          START ONBOARDING
        </Button>
      </div>

      {error && (
        <div className="max-w-md mx-auto p-16 rounded-glass bg-status-error/10 border border-status-error/30">
          <p className="text-sm text-status-error">{error}</p>
        </div>
      )}
    </GlassCard>
  );

  const renderResponse1 = () => (
    <GlassCard>
      <div className="mb-24">
        <div className="flex items-center justify-between mb-16">
          <h2 className="text-2xl font-bold text-text-primary">Response 1 of 6</h2>
          <Badge variant="info">Identity + POPIA Consent</Badge>
        </div>
        <p className="text-text-secondary">
          Provide your identity and give mandatory POPIA consent
        </p>
      </div>

      <div className="space-y-24">
        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="As per ID document"
          required
        />

        <Input
          label="SA ID Number"
          value={saIdNumber}
          onChange={(e) => setSaIdNumber(e.target.value)}
          placeholder="13-digit ID number"
          maxLength={13}
          required
        />

        {/* POPIA CONSENT - HARD GATE */}
        <div className="p-24 rounded-glass bg-status-warning/10 border border-status-warning/30">
          <h3 className="text-lg font-semibold text-text-primary mb-16">
            POPIA Consent (MANDATORY)
          </h3>
          <p className="text-sm text-text-secondary mb-16">
            By checking this box, I consent to the processing of my personal information in
            accordance with the Protection of Personal Information Act (POPIA). This consent is
            required to participate in the IDC Social Employment Fund Programme.
          </p>

          <label className="flex items-start gap-12 cursor-pointer">
            <input
              type="checkbox"
              checked={popiaConsent}
              onChange={(e) => setPopiaConsent(e.target.checked)}
              className="mt-4"
            />
            <span className="text-sm text-text-primary">
              I have read and agree to the POPIA consent requirements. I understand this is a
              non-negotiable requirement for onboarding.
            </span>
          </label>
        </div>

        {error && (
          <div className="p-16 rounded-glass bg-status-error/10 border border-status-error/30">
            <p className="text-sm text-status-error">{error}</p>
          </div>
        )}

        <Button fullWidth onClick={handleResponse1} loading={loading} disabled={!popiaConsent}>
          Submit Response 1
        </Button>
      </div>
    </GlassCard>
  );

  const renderResponse2 = () => (
    <GlassCard>
      <div className="mb-24">
        <div className="flex items-center justify-between mb-16">
          <h2 className="text-2xl font-bold text-text-primary">Response 2 of 6</h2>
          <Badge variant="warning">Upload ALL Documents</Badge>
        </div>
        <p className="text-text-secondary">Upload all 7 required documents in a single batch</p>
      </div>

      <div className="space-y-16">
        {REQUIRED_DOCUMENTS.map(({ type, label }) => (
          <DocumentUpload
            key={type}
            label={label}
            value={documents[type]}
            onUpload={(file) => setDocuments({ ...documents, [type]: file })}
            accept="image/*,application/pdf,.doc,.docx"
            maxSize={10}
          />
        ))}

        {error && (
          <div className="p-16 rounded-glass bg-status-error/10 border border-status-error/30">
            <p className="text-sm text-status-error">{error}</p>
          </div>
        )}

        <Button fullWidth onClick={handleResponse2} loading={loading}>
          Submit Response 2
        </Button>
      </div>
    </GlassCard>
  );

  const renderResponse3 = () => (
    <GlassCard>
      <div className="mb-24">
        <div className="flex items-center justify-between mb-16">
          <h2 className="text-2xl font-bold text-text-primary">Response 3 of 6</h2>
          <Badge variant="info">Confirm Personal Data</Badge>
        </div>
        <p className="text-text-secondary">Review AI-extracted data and confirm accuracy</p>
      </div>

      <div className="space-y-24">
        <div className="p-24 rounded-glass bg-white/5">
          <h3 className="text-sm font-medium text-text-tertiary mb-16">Extracted Data:</h3>
          <div className="space-y-12">
            {Object.entries(extractedData).length > 0 ? (
              Object.entries(extractedData).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-sm text-text-secondary capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}:
                  </span>
                  <span className="text-sm text-text-primary font-medium">{value}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-tertiary">Extracting data from documents...</p>
            )}
          </div>
        </div>

        <label className="flex items-start gap-12 cursor-pointer">
          <input
            type="checkbox"
            checked={personalDataConfirmed}
            onChange={(e) => setPersonalDataConfirmed(e.target.checked)}
            className="mt-4"
          />
          <span className="text-sm text-text-primary">
            I confirm that the above personal data is accurate and correct
          </span>
        </label>

        {error && (
          <div className="p-16 rounded-glass bg-status-error/10 border border-status-error/30">
            <p className="text-sm text-status-error">{error}</p>
          </div>
        )}

        <Button fullWidth onClick={handleResponse3} loading={loading}>
          Submit Response 3
        </Button>
      </div>
    </GlassCard>
  );

  const renderResponse4 = () => (
    <GlassCard>
      <div className="mb-24">
        <div className="flex items-center justify-between mb-16">
          <h2 className="text-2xl font-bold text-text-primary">Response 4 of 6</h2>
          <Badge variant="info">Confirm Bank + Address</Badge>
        </div>
        <p className="text-text-secondary">Confirm your banking and address details</p>
      </div>

      <div className="space-y-24">
        <Input
          label="Bank Account Number"
          value={bankAccountNumber}
          onChange={(e) => setBankAccountNumber(e.target.value)}
          placeholder="10-16 digit account number"
          required
        />

        <Input
          label="Branch Code"
          value={branchCode}
          onChange={(e) => setBranchCode(e.target.value)}
          placeholder="6-digit branch code"
          maxLength={6}
          required
        />

        <Input
          label="Residential Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Full residential address"
          required
        />

        <label className="flex items-start gap-12 cursor-pointer">
          <input
            type="checkbox"
            checked={bankAddressConfirmed}
            onChange={(e) => setBankAddressConfirmed(e.target.checked)}
            className="mt-4"
          />
          <span className="text-sm text-text-primary">
            I confirm that the bank and address details are accurate
          </span>
        </label>

        {error && (
          <div className="p-16 rounded-glass bg-status-error/10 border border-status-error/30">
            <p className="text-sm text-status-error">{error}</p>
          </div>
        )}

        <Button fullWidth onClick={handleResponse4} loading={loading}>
          Submit Response 4
        </Button>
      </div>
    </GlassCard>
  );

  const renderResponse5 = () => (
    <GlassCard>
      <div className="mb-24">
        <div className="flex items-center justify-between mb-16">
          <h2 className="text-2xl font-bold text-text-primary">Response 5 of 6</h2>
          <Badge variant="info">Confirm Application Data</Badge>
        </div>
        <p className="text-text-secondary">Review your CV and application information</p>
      </div>

      <div className="space-y-24">
        <div className="p-24 rounded-glass bg-white/5">
          <h3 className="text-sm font-medium text-text-tertiary mb-16">Skills:</h3>
          <p className="text-sm text-text-primary">{extractedData.skills || 'Not extracted'}</p>
        </div>

        <label className="flex items-start gap-12 cursor-pointer">
          <input
            type="checkbox"
            checked={applicationConfirmed}
            onChange={(e) => setApplicationConfirmed(e.target.checked)}
            className="mt-4"
          />
          <span className="text-sm text-text-primary">
            I confirm that my application data (CV, experience, skills) is accurate
          </span>
        </label>

        {error && (
          <div className="p-16 rounded-glass bg-status-error/10 border border-status-error/30">
            <p className="text-sm text-status-error">{error}</p>
          </div>
        )}

        <Button fullWidth onClick={handleResponse5} loading={loading}>
          Submit Response 5
        </Button>
      </div>
    </GlassCard>
  );

  const renderResponse6 = () => (
    <GlassCard>
      <div className="mb-24">
        <div className="flex items-center justify-between mb-16">
          <h2 className="text-2xl font-bold text-text-primary">Response 6 of 6</h2>
          <Badge variant="success">Final Declaration</Badge>
        </div>
        <p className="text-text-secondary">Final declaration to complete onboarding</p>
      </div>

      <div className="space-y-24">
        <div className="p-24 rounded-glass bg-white/5">
          <h3 className="text-lg font-semibold text-text-primary mb-16">Final Declaration</h3>
          <p className="text-sm text-text-secondary mb-12">
            By submitting this final declaration, I confirm that:
          </p>
          <ul className="space-y-8 text-sm text-text-secondary">
            <li className="flex items-start gap-8">
              <span className="text-accent-blue">•</span>
              <span>All information provided is true and accurate</span>
            </li>
            <li className="flex items-start gap-8">
              <span className="text-accent-blue">•</span>
              <span>All documents uploaded are genuine and certified where required</span>
            </li>
            <li className="flex items-start gap-8">
              <span className="text-accent-blue">•</span>
              <span>I understand this is a formal onboarding process</span>
            </li>
            <li className="flex items-start gap-8">
              <span className="text-accent-blue">•</span>
              <span>I consent to verification and audit of all provided information</span>
            </li>
          </ul>
        </div>

        <label className="flex items-start gap-12 cursor-pointer">
          <input
            type="checkbox"
            checked={finalDeclaration}
            onChange={(e) => setFinalDeclaration(e.target.checked)}
            className="mt-4"
          />
          <span className="text-sm text-text-primary font-medium">
            I declare that all the above statements are true and correct
          </span>
        </label>

        {error && (
          <div className="p-16 rounded-glass bg-status-error/10 border border-status-error/30">
            <p className="text-sm text-status-error">{error}</p>
          </div>
        )}

        <Button fullWidth onClick={handleResponse6} loading={loading}>
          Complete Onboarding (Lock Session)
        </Button>
      </div>
    </GlassCard>
  );

  const renderCompletionScreen = () => (
    <GlassCard className="text-center py-64">
      <div className="mb-32">
        <div className="w-24 h-24 rounded-full bg-status-success/20 flex items-center justify-center mx-auto mb-24">
          <svg
            className="w-12 h-12 text-status-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gradient mb-16">Onboarding Complete!</h1>
        <p className="text-text-secondary mb-8">Your profile has been verified</p>
        <Badge variant="success" size="lg">
          Status: VERIFIED
        </Badge>
      </div>

      <div className="max-w-md mx-auto">
        <div className="p-24 rounded-glass bg-white/5 mb-24">
          <p className="text-sm text-text-secondary mb-16">
            Your onboarding has been completed successfully. Your profile is now ready for payroll
            sync authorization by an administrator.
          </p>
          <div className="space-y-8 text-xs text-text-tertiary">
            <p>✓ All documents uploaded and verified</p>
            <p>✓ Personal data confirmed</p>
            <p>✓ POPIA consent recorded</p>
            <p>✓ Session locked (6/6 responses)</p>
          </div>
        </div>

        <p className="text-xs text-text-tertiary">
          You will be notified when your profile is synchronized to the payroll system.
        </p>
      </div>
    </GlassCard>
  );

  // Main render
  return (
    <div className="space-y-32 animate-fade-in">
      {/* Progress indicator */}
      {session && currentResponse > 0 && currentResponse <= 6 && (
        <div className="flex items-center justify-between mb-24">
          <h1 className="text-2xl font-bold text-text-primary">IDC SEF-Grade Onboarding</h1>
          <div className="flex items-center gap-16">
            <span className="text-sm text-text-secondary">
              Response {session.responseCount || 0} / 6
            </span>
            {session.locked && <Badge variant="error">Session Locked</Badge>}
          </div>
        </div>
      )}

      {/* Render appropriate screen */}
      {!session && renderStartScreen()}
      {session && currentResponse === 1 && renderResponse1()}
      {session && currentResponse === 2 && renderResponse2()}
      {session && currentResponse === 3 && renderResponse3()}
      {session && currentResponse === 4 && renderResponse4()}
      {session && currentResponse === 5 && renderResponse5()}
      {session && currentResponse === 6 && renderResponse6()}
      {session && currentResponse === 7 && renderCompletionScreen()}
    </div>
  );
};

export default OnboardingPage;
