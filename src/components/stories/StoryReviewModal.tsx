/**
 * Story Review Modal
 *
 * Allows admins to review and approve/reject impact stories
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { dbUtils, db } from '@/utils/db';
import type { ImpactStory, Participant } from '@/types';

interface StoryReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId?: string;
  onReviewComplete?: () => void;
}

export const StoryReviewModal: React.FC<StoryReviewModalProps> = ({
  isOpen,
  onClose,
  storyId,
  onReviewComplete,
}) => {
  const { user } = useAuthStore();
  const [story, setStory] = useState<ImpactStory | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && storyId) {
      loadStory();
    }
  }, [isOpen, storyId]);

  const loadStory = async () => {
    if (!storyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const storyData = await db.impactStories.get(storyId);
      if (!storyData) {
        setError('Story not found');
        return;
      }

      const participantData = await db.participants.get(storyData.participantId);

      setStory(storyData);
      setParticipant(participantData || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load story');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!story || !user) return;

    setIsProcessing(true);
    setError(null);

    try {
      await dbUtils.updateImpactStoryStatus(story.id, 'approved', user.id);
      onReviewComplete?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to approve story');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!story || !user) return;

    setIsProcessing(true);
    setError(null);

    try {
      await dbUtils.updateImpactStoryStatus(story.id, 'published', user.id);
      onReviewComplete?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish story');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!story || !user) return;

    const confirmed = confirm(
      'Are you sure you want to reject this story? The participant will be notified.'
    );

    if (!confirmed) return;

    setIsProcessing(true);
    setError(null);

    try {
      await dbUtils.updateImpactStoryStatus(story.id, 'draft', user.id);
      onReviewComplete?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reject story');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Impact Story" size="lg">
      {isLoading ? (
        <div className="text-center py-32">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-accent-blue"></div>
          <p className="text-text-secondary mt-16">Loading story...</p>
        </div>
      ) : error ? (
        <div className="p-16 rounded-glass bg-error/10 border border-error/20">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : story && participant ? (
        <div className="space-y-24">
          {/* Participant Info */}
          <div className="p-16 rounded-glass bg-surface-secondary border border-border">
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-sm font-semibold text-text-primary">Participant Information</h3>
              <span
                className={`px-12 py-4 rounded-full text-xs font-medium ${
                  story.status === 'review'
                    ? 'bg-warning/10 text-warning'
                    : story.status === 'approved'
                    ? 'bg-success/10 text-success'
                    : story.status === 'published'
                    ? 'bg-accent-blue/10 text-accent-blue'
                    : 'bg-text-secondary/10 text-text-secondary'
                }`}
              >
                {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-12 text-sm">
              <div>
                <span className="text-text-secondary">Name:</span>
                <span className="ml-8 text-text-primary font-medium">{participant.fullName}</span>
              </div>
              <div>
                <span className="text-text-secondary">ID Number:</span>
                <span className="ml-8 text-text-primary font-medium">{participant.idNumber}</span>
              </div>
              <div>
                <span className="text-text-secondary">Site:</span>
                <span className="ml-8 text-text-primary font-medium">
                  {participant.siteName || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-text-secondary">Submitted:</span>
                <span className="ml-8 text-text-primary font-medium">
                  {formatDate(story.createdAt)}
                </span>
              </div>
            </div>
            <div className="mt-12 flex items-center">
              <span className="text-text-secondary text-sm">Consent Given:</span>
              <span
                className={`ml-8 px-8 py-2 rounded text-xs font-medium ${
                  story.participantConsentGiven
                    ? 'bg-success/10 text-success'
                    : 'bg-error/10 text-error'
                }`}
              >
                {story.participantConsentGiven ? 'Yes' : 'No'}
              </span>
            </div>
          </div>

          {/* Story Title */}
          <div>
            <h3 className="text-lg font-bold text-text-primary mb-8">{story.title}</h3>
          </div>

          {/* Story Narrative */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-8">Story</label>
            <div className="p-16 rounded-glass bg-surface-secondary border border-border">
              <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                {story.narrative}
              </p>
            </div>
          </div>

          {/* Quote */}
          {story.quote && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-8">Quote</label>
              <div className="p-16 rounded-glass bg-accent-blue/5 border border-accent-blue/20 border-l-4">
                <p className="text-sm text-text-primary italic">"{story.quote}"</p>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-16">
            {/* Work Type */}
            {story.workType && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-4">
                  Work Type
                </label>
                <p className="text-sm text-text-primary">{story.workType}</p>
              </div>
            )}

            {/* Milestone */}
            {story.milestone && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-4">
                  Milestone
                </label>
                <p className="text-sm text-text-primary">{story.milestone}</p>
              </div>
            )}
          </div>

          {/* Skills */}
          {story.skills && story.skills.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-8">
                Skills Gained
              </label>
              <div className="flex flex-wrap gap-8">
                {story.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-12 py-6 rounded-full bg-accent-blue/10 text-accent-blue text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {story.tags && story.tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-8">Tags</label>
              <div className="flex flex-wrap gap-8">
                {story.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-12 py-6 rounded-full bg-surface-secondary text-text-secondary text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Review Actions */}
          <div className="pt-16 border-t border-border">
            <div className="flex justify-end space-x-12">
              <Button variant="secondary" onClick={onClose} disabled={isProcessing}>
                Close
              </Button>
              {story.status === 'review' && (
                <>
                  <Button variant="secondary" onClick={handleReject} disabled={isProcessing}>
                    Reject
                  </Button>
                  <Button variant="primary" onClick={handleApprove} disabled={isProcessing}>
                    Approve
                  </Button>
                  <Button variant="primary" onClick={handlePublish} disabled={isProcessing}>
                    {isProcessing ? 'Publishing...' : 'Approve & Publish'}
                  </Button>
                </>
              )}
              {story.status === 'approved' && (
                <Button variant="primary" onClick={handlePublish} disabled={isProcessing}>
                  {isProcessing ? 'Publishing...' : 'Publish Now'}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-32">
          <p className="text-text-secondary">No story selected</p>
        </div>
      )}
    </Modal>
  );
};
