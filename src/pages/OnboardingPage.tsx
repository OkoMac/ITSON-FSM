import React, { useState } from 'react';
import { GlassCard, Input, Button } from '@/components/ui';
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper';
import { DocumentUpload } from '@/components/onboarding/DocumentUpload';

const ONBOARDING_STEPS = [
  { id: 1, title: 'Personal Details', description: 'Basic information' },
  { id: 2, title: 'Documents', description: 'Upload required docs' },
  { id: 3, title: 'POPIA Consent', description: 'Data protection' },
  { id: 4, title: 'Biometric', description: 'Face & fingerprint' },
];

const OnboardingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal Details
    firstName: '',
    lastName: '',
    idNumber: '',
    email: '',
    phoneNumber: '',
    address: '',
    // Step 2: Documents
    idDocument: null as File | null,
    employmentContract: null as File | null,
    bankConfirmation: null as File | null,
    affidavit: null as File | null,
    // Step 3: POPIA
    popiaConsent: false,
    marketingConsent: false,
  });

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Onboarding submitted:', formData);
    alert('Onboarding completed successfully!');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>

            <Input
              label="SA ID Number"
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              helperText="13-digit South African ID number"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                helperText="+27 format"
                required
              />
            </div>

            <Input
              label="Physical Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-24">
            <DocumentUpload
              label="Certified SA ID Document"
              description="Clear copy of your South African ID (front and back)"
              required
              value={formData.idDocument}
              onUpload={(file) => setFormData({ ...formData, idDocument: file })}
            />

            <DocumentUpload
              label="Employment Contract"
              description="Signed 6-page employment contract"
              required
              value={formData.employmentContract}
              onUpload={(file) => setFormData({ ...formData, employmentContract: file })}
            />

            <DocumentUpload
              label="Bank Confirmation Letter"
              description="Bank statement or confirmation letter (not older than 3 months)"
              required
              value={formData.bankConfirmation}
              onUpload={(file) => setFormData({ ...formData, bankConfirmation: file })}
            />

            <DocumentUpload
              label="Affidavit"
              description="Signed affidavit with matching name and ID"
              required
              value={formData.affidavit}
              onUpload={(file) => setFormData({ ...formData, affidavit: file })}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-24">
            <div className="p-24 glass-card bg-accent-blue/10 border border-accent-blue/30">
              <h3 className="text-lg font-semibold text-text-primary mb-16">
                Protection of Personal Information (POPIA)
              </h3>
              <div className="space-y-12 text-sm text-text-secondary">
                <p>
                  We collect and process your personal information to administer the SEF Programme.
                  This includes:
                </p>
                <ul className="list-disc list-inside space-y-4 ml-8">
                  <li>Identity documents and biometric data</li>
                  <li>Work location and attendance records</li>
                  <li>Photos of your work activities</li>
                  <li>Performance and feedback records</li>
                </ul>
              </div>
            </div>

            <div className="space-y-16">
              <label className="flex items-start gap-12 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.popiaConsent}
                  onChange={(e) => setFormData({ ...formData, popiaConsent: e.target.checked })}
                  className="mt-4 w-5 h-5 rounded border-white/20 bg-white/5 text-accent-blue focus:ring-accent-blue"
                />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    I consent to data processing for programme administration
                    <span className="text-status-error ml-1">*</span>
                  </p>
                  <p className="text-xs text-text-tertiary mt-4">
                    Required for participation in the SEF Programme
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-12 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.marketingConsent}
                  onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
                  className="mt-4 w-5 h-5 rounded border-white/20 bg-white/5 text-accent-blue focus:ring-accent-blue"
                />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    I consent to use of my photos/story for programme communications
                  </p>
                  <p className="text-xs text-text-tertiary mt-4">
                    Optional - You can withdraw this consent at any time
                  </p>
                </div>
              </label>
            </div>

            <div className="p-16 glass-card bg-white/5">
              <p className="text-xs text-text-tertiary">
                By proceeding, you agree to our Privacy Policy and Terms of Service.
                Your data will be retained for 7 years as required by law.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-24 text-center">
            <div className="w-48 h-48 mx-auto bg-accent-blue/20 rounded-full flex items-center justify-center">
              <svg className="w-24 h-24 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-text-primary mb-8">
                Biometric Enrollment
              </h3>
              <p className="text-text-secondary max-w-md mx-auto">
                Complete your enrollment by capturing your facial biometric data and fingerprint.
                This ensures secure attendance tracking.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-2xl mx-auto text-left">
              <div className="glass-card p-24">
                <div className="w-16 h-16 mb-16 bg-accent-blue/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-text-primary mb-8">
                  Facial Recognition
                </h4>
                <p className="text-sm text-text-secondary">
                  Position your face within the circle and follow the on-screen instructions
                </p>
              </div>

              <div className="glass-card p-24">
                <div className="w-16 h-16 mb-16 bg-accent-blue/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                    />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-text-primary mb-8">
                  Fingerprint Scan
                </h4>
                <p className="text-sm text-text-secondary">
                  Place your finger on the scanner when prompted by your supervisor
                </p>
              </div>
            </div>

            <div className="p-16 glass-card bg-status-success/10 border border-status-success/30 max-w-2xl mx-auto">
              <p className="text-sm text-status-success">
                ✓ Your biometric data is stored securely and cannot be reverse-engineered
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.firstName &&
          formData.lastName &&
          formData.idNumber &&
          formData.email &&
          formData.phoneNumber &&
          formData.address
        );
      case 2:
        return (
          formData.idDocument &&
          formData.employmentContract &&
          formData.bankConfirmation &&
          formData.affidavit
        );
      case 3:
        return formData.popiaConsent;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-32 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-8">
          Participant Onboarding
        </h1>
        <p className="text-text-secondary">
          Complete all steps to activate your programme participation
        </p>
      </div>

      <GlassCard variant="elevated">
        <OnboardingStepper steps={ONBOARDING_STEPS} currentStep={currentStep} />

        <div className="min-h-[400px]">{renderStepContent()}</div>

        <div className="flex justify-between mt-32 pt-24 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>

          {currentStep < ONBOARDING_STEPS.length ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed()}>
              Complete Onboarding
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default OnboardingPage;
