/**
 * Story Card Component
 *
 * Displays an individual impact story in card format
 */

import React from 'react';
import type { ImpactStory } from '@/types';

interface StoryCardProps {
  story: ImpactStory;
  participantName?: string;
  onClick?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  participantName,
  onClick,
  showActions = false,
  onEdit,
  onDelete,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-text-secondary/10 text-text-secondary';
      case 'review':
        return 'bg-warning/10 text-warning';
      case 'approved':
        return 'bg-success/10 text-success';
      case 'published':
        return 'bg-accent-blue/10 text-accent-blue';
      default:
        return 'bg-text-secondary/10 text-text-secondary';
    }
  };

  return (
    <div
      className={`glass-card rounded-glass p-20 space-y-16 hover:scale-[1.02] transition-transform ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-text-primary mb-4">{story.title}</h3>
          {participantName && (
            <p className="text-sm text-text-secondary">by {participantName}</p>
          )}
        </div>
        <span className={`px-12 py-4 rounded-full text-xs font-medium ${getStatusColor(story.status)}`}>
          {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
        </span>
      </div>

      {/* Narrative Preview */}
      <p className="text-sm text-text-primary leading-relaxed">
        {truncateText(story.narrative, 200)}
      </p>

      {/* Quote */}
      {story.quote && (
        <div className="p-12 rounded-glass bg-accent-blue/5 border-l-4 border-accent-blue/30">
          <p className="text-sm text-text-primary italic">"{truncateText(story.quote, 100)}"</p>
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-2 gap-12 text-xs">
        {story.workType && (
          <div>
            <span className="text-text-secondary">Work Type:</span>
            <span className="ml-4 text-text-primary font-medium">{story.workType}</span>
          </div>
        )}
        {story.milestone && (
          <div>
            <span className="text-text-secondary">Milestone:</span>
            <span className="ml-4 text-text-primary font-medium">{story.milestone}</span>
          </div>
        )}
      </div>

      {/* Skills */}
      {story.skills && story.skills.length > 0 && (
        <div className="flex flex-wrap gap-6">
          {story.skills.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="px-8 py-4 rounded-full bg-accent-blue/10 text-accent-blue text-xs font-medium"
            >
              {skill}
            </span>
          ))}
          {story.skills.length > 3 && (
            <span className="px-8 py-4 rounded-full bg-surface-secondary text-text-secondary text-xs font-medium">
              +{story.skills.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Tags */}
      {story.tags && story.tags.length > 0 && (
        <div className="flex flex-wrap gap-6">
          {story.tags.slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className="text-xs text-text-secondary"
            >
              #{tag}
            </span>
          ))}
          {story.tags.length > 4 && (
            <span className="text-xs text-text-secondary">
              +{story.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-12 border-t border-border flex items-center justify-between">
        <div className="text-xs text-text-secondary">
          {story.publishedAt ? (
            <>Published {formatDate(story.publishedAt)}</>
          ) : (
            <>Created {formatDate(story.createdAt)}</>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-8">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-8 rounded-lg hover:bg-surface-secondary transition-colors"
                title="Edit story"
              >
                <svg
                  className="w-16 h-16 text-text-secondary hover:text-accent-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-8 rounded-lg hover:bg-surface-secondary transition-colors"
                title="Delete story"
              >
                <svg
                  className="w-16 h-16 text-text-secondary hover:text-error"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
