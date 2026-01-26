/**
 * Story Gallery Component
 *
 * Displays a gallery of impact stories with filtering
 */

import React, { useState, useEffect } from 'react';
import { StoryCard } from './StoryCard';
import { StoryReviewModal } from './StoryReviewModal';
import { db } from '@/utils/db';
import type { ImpactStory, Participant } from '@/types';

interface StoryGalleryProps {
  status?: ImpactStory['status'];
  participantId?: string;
  showActions?: boolean;
  onEdit?: (story: ImpactStory) => void;
  onDelete?: (storyId: string) => void;
}

export const StoryGallery: React.FC<StoryGalleryProps> = ({
  status,
  participantId,
  showActions = false,
  onEdit,
  onDelete,
}) => {
  const [stories, setStories] = useState<ImpactStory[]>([]);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStoryId, setSelectedStoryId] = useState<string | undefined>();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ImpactStory['status'] | 'all'>(
    status || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStories();
  }, [status, participantId, filterStatus]);

  const loadStories = async () => {
    setIsLoading(true);

    try {
      let storiesData: ImpactStory[];

      if (participantId) {
        // Get stories for specific participant
        storiesData = await db.impactStories
          .where('participantId')
          .equals(participantId)
          .reverse()
          .sortBy('createdAt');
      } else if (filterStatus !== 'all') {
        // Filter by status
        storiesData = await db.impactStories
          .where('status')
          .equals(filterStatus)
          .reverse()
          .sortBy('createdAt');
      } else {
        // Get all stories
        storiesData = await db.impactStories.reverse().sortBy('createdAt');
      }

      // Load participant data
      const participantIds = [...new Set(storiesData.map((s) => s.participantId))];
      const participantsData = await db.participants
        .where('id')
        .anyOf(participantIds)
        .toArray();

      const participantsMap = new Map(participantsData.map((p) => [p.id, p]));

      setStories(storiesData);
      setParticipants(participantsMap);
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoryClick = (storyId: string) => {
    setSelectedStoryId(storyId);
    setIsReviewModalOpen(true);
  };

  const handleReviewComplete = () => {
    loadStories();
  };

  const filteredStories = stories.filter((story) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        story.title.toLowerCase().includes(query) ||
        story.narrative.toLowerCase().includes(query) ||
        story.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
        story.skills?.some((skill) => skill.toLowerCase().includes(query))
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="text-center py-48">
        <div className="inline-block animate-spin rounded-full h-48 w-48 border-b-2 border-accent-blue"></div>
        <p className="text-text-secondary mt-16">Loading stories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-24">
      {/* Filters and Search */}
      {!participantId && (
        <div className="flex flex-col sm:flex-row gap-16">
          {/* Status Filter */}
          {!status && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-primary mb-8">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-16 py-12 rounded-glass glass-button text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
              >
                <option value="all">All Stories</option>
                <option value="draft">Draft</option>
                <option value="review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
              </select>
            </div>
          )}

          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-primary mb-8">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories, tags, skills..."
              className="w-full px-16 py-12 rounded-glass glass-button text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
          </div>
        </div>
      )}

      {/* Stories Grid */}
      {filteredStories.length === 0 ? (
        <div className="text-center py-48">
          <svg
            className="w-64 h-64 mx-auto text-text-secondary opacity-50 mb-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <p className="text-text-secondary text-lg">
            {searchQuery ? 'No stories found matching your search' : 'No stories yet'}
          </p>
          {!participantId && (
            <p className="text-text-secondary text-sm mt-8">
              Stories will appear here once participants start sharing their experiences
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24">
          {filteredStories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              participantName={participants.get(story.participantId)?.fullName}
              onClick={() => handleStoryClick(story.id)}
              showActions={showActions}
              onEdit={onEdit ? () => onEdit(story) : undefined}
              onDelete={onDelete ? () => onDelete(story.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Review Modal */}
      <StoryReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedStoryId(undefined);
        }}
        storyId={selectedStoryId}
        onReviewComplete={handleReviewComplete}
      />
    </div>
  );
};
