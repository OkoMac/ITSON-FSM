/**
 * Stories Page
 *
 * View and manage impact stories
 */

import React, { useState, useEffect } from 'react';
import { StoryGallery, StorySubmissionModal } from '@/components/stories';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { db } from '@/utils/db';
import type { Participant } from '@/types';

const StoriesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [activeTab, setActiveTab] = useState<'published' | 'my-stories' | 'review'>(
    'published'
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const isAdmin = user?.role === 'property-point' || user?.role === 'project-manager';
  const isWorker = user?.role === 'worker';

  useEffect(() => {
    if (isWorker && user) {
      loadParticipant();
    }
  }, [user]);

  const loadParticipant = async () => {
    if (!user) return;

    try {
      const participantData = await db.participants
        .where('userId')
        .equals(user.id)
        .first();

      setParticipant(participantData || null);
    } catch (error) {
      console.error('Failed to load participant:', error);
    }
  };

  const handleSubmitSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="page-container">
      <div className="content-wrapper">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-16 mb-32">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-8">Impact Stories</h1>
            <p className="text-text-secondary">
              Read inspiring success stories from our programme participants
            </p>
          </div>

          {isWorker && participant && (
            <Button
              variant="primary"
              onClick={() => setIsSubmissionModalOpen(true)}
            >
              <svg
                className="w-20 h-20 mr-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Share Your Story
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-32">
          <div className="flex space-x-8 border-b border-border">
            <button
              onClick={() => setActiveTab('published')}
              className={`px-20 py-12 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'published'
                  ? 'text-accent-blue border-accent-blue'
                  : 'text-text-secondary border-transparent hover:text-text-primary'
              }`}
            >
              Published Stories
            </button>

            {isWorker && participant && (
              <button
                onClick={() => setActiveTab('my-stories')}
                className={`px-20 py-12 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'my-stories'
                    ? 'text-accent-blue border-accent-blue'
                    : 'text-text-secondary border-transparent hover:text-text-primary'
                }`}
              >
                My Stories
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveTab('review')}
                className={`px-20 py-12 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'review'
                    ? 'text-accent-blue border-accent-blue'
                    : 'text-text-secondary border-transparent hover:text-text-primary'
                }`}
              >
                Pending Review
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div key={refreshKey}>
          {activeTab === 'published' && (
            <div>
              <div className="mb-24 p-16 rounded-glass bg-accent-blue/5 border border-accent-blue/20">
                <p className="text-sm text-text-secondary">
                  These stories showcase the real impact of our programme on the lives of participants.
                </p>
              </div>
              <StoryGallery status="published" />
            </div>
          )}

          {activeTab === 'my-stories' && participant && (
            <div>
              <div className="mb-24 p-16 rounded-glass bg-surface-secondary border border-border">
                <p className="text-sm text-text-secondary">
                  View and manage your submitted stories. Stories are reviewed before being published.
                </p>
              </div>
              <StoryGallery participantId={participant.id} showActions={true} />
            </div>
          )}

          {activeTab === 'review' && isAdmin && (
            <div>
              <div className="mb-24 p-16 rounded-glass bg-warning/5 border border-warning/20">
                <p className="text-sm text-text-secondary">
                  Review and approve stories submitted by participants. Click on a story to review it.
                </p>
              </div>
              <StoryGallery status="review" />
            </div>
          )}
        </div>

        {/* Submission Modal */}
        {participant && (
          <StorySubmissionModal
            isOpen={isSubmissionModalOpen}
            onClose={() => setIsSubmissionModalOpen(false)}
            participantId={participant.id}
            onSubmitSuccess={handleSubmitSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default StoriesPage;
