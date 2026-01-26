/**
 * Story Submission Modal
 *
 * Allows participants to submit their impact stories
 */

import React, { useState, ChangeEvent } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { dbUtils } from '@/utils/db';
import type { ImpactStory } from '@/types';

interface StorySubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  onSubmitSuccess?: () => void;
}

export const StorySubmissionModal: React.FC<StorySubmissionModalProps> = ({
  isOpen,
  onClose,
  participantId,
  onSubmitSuccess,
}) => {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    narrative: '',
    quote: '',
    workType: '',
    skills: '',
    milestone: '',
    tags: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      setError('Please provide a title for your story');
      return;
    }

    if (!formData.narrative.trim()) {
      setError('Please share your story');
      return;
    }

    if (!consentGiven) {
      setError('Please give consent to share your story');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const story: ImpactStory = {
        id: crypto.randomUUID(),
        participantId,
        participantConsentGiven: consentGiven,
        title: formData.title.trim(),
        narrative: formData.narrative.trim(),
        quote: formData.quote.trim() || undefined,
        photos: [],
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
        workType: formData.workType.trim() || undefined,
        skills: formData.skills
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s),
        milestone: formData.milestone.trim() || undefined,
        status: 'review',
        createdBy: user?.id || participantId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dbUtils.addImpactStory(story);

      // Reset form
      setFormData({
        title: '',
        narrative: '',
        quote: '',
        workType: '',
        skills: '',
        milestone: '',
        tags: '',
      });
      setConsentGiven(false);

      onSubmitSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit story. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Share Your Impact Story" size="lg">
      <div className="space-y-24">
        {/* Info */}
        <div className="p-16 rounded-glass bg-accent-blue/10 border border-accent-blue/20">
          <p className="text-sm text-text-secondary">
            Share your journey and inspire others! Your story will be reviewed before being published.
          </p>
        </div>

        {error && (
          <div className="p-16 rounded-glass bg-error/10 border border-error/20">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <Input
            label="Story Title *"
            value={formData.title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('title', e.target.value)}
            placeholder="e.g., From Unemployed to Skilled Worker"
            disabled={isSubmitting}
          />
        </div>

        {/* Narrative */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-8">
            Your Story *
          </label>
          <textarea
            value={formData.narrative}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleInputChange('narrative', e.target.value)}
            placeholder="Share your journey, challenges, achievements, and what this opportunity meant to you..."
            rows={8}
            disabled={isSubmitting}
            className="w-full px-16 py-12 rounded-glass glass-button text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue resize-none"
          />
          <p className="text-xs text-text-secondary mt-4">
            {formData.narrative.length} characters
          </p>
        </div>

        {/* Quote */}
        <div>
          <Input
            label="Memorable Quote (Optional)"
            value={formData.quote}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('quote', e.target.value)}
            placeholder="A quote that captures your experience..."
            disabled={isSubmitting}
          />
        </div>

        {/* Work Type */}
        <div>
          <Input
            label="Type of Work (Optional)"
            value={formData.workType}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('workType', e.target.value)}
            placeholder="e.g., Construction, Landscaping, Maintenance"
            disabled={isSubmitting}
          />
        </div>

        {/* Skills */}
        <div>
          <Input
            label="Skills Gained (Optional)"
            value={formData.skills}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('skills', e.target.value)}
            placeholder="e.g., Teamwork, Technical skills, Communication (comma-separated)"
            disabled={isSubmitting}
          />
        </div>

        {/* Milestone */}
        <div>
          <Input
            label="Major Milestone (Optional)"
            value={formData.milestone}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('milestone', e.target.value)}
            placeholder="e.g., Completed first project, Received certification"
            disabled={isSubmitting}
          />
        </div>

        {/* Tags */}
        <div>
          <Input
            label="Tags (Optional)"
            value={formData.tags}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('tags', e.target.value)}
            placeholder="e.g., success, training, employment (comma-separated)"
            disabled={isSubmitting}
          />
        </div>

        {/* Consent */}
        <div className="p-16 rounded-glass bg-surface-secondary border border-border">
          <label className="flex items-start space-x-12 cursor-pointer">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              disabled={isSubmitting}
              className="mt-4 w-16 h-16 rounded border-border text-accent-blue focus:ring-2 focus:ring-accent-blue"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-text-primary">
                Consent to Share Story *
              </span>
              <p className="text-xs text-text-secondary mt-4">
                I give consent for my story to be shared publicly for advocacy and awareness purposes.
                My personal information will be handled in accordance with POPIA regulations.
              </p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-12">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !consentGiven}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Story'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
