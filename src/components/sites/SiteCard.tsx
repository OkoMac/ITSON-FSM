import React from 'react';
import { GlassCard, Button, Badge } from '@/components/ui';
import type { Site } from '@/types';

interface SiteCardProps {
  site: Site;
  onView: (site: Site) => void;
  onEdit: (site: Site) => void;
}

export const SiteCard: React.FC<SiteCardProps> = ({ site, onView, onEdit }) => {
  const statusColors = {
    active: 'success' as const,
    inactive: 'default' as const,
    maintenance: 'warning' as const,
  };

  const participantCount = site.participantIds?.length || 0;
  const capacityPercentage = site.maxCapacity ? (participantCount / site.maxCapacity) * 100 : 0;

  return (
    <GlassCard variant="hover" className="cursor-pointer" onClick={() => onView(site)}>
      <div className="space-y-16">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              {site.name}
            </h3>
            <p className="text-sm text-text-secondary line-clamp-1">
              {site.address}
            </p>
          </div>
          <Badge variant={statusColors[site.status]}>
            {site.status}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-16">
          <div className="space-y-4">
            <p className="text-xs text-text-tertiary">Participants</p>
            <div className="flex items-baseline gap-4">
              <p className="text-2xl font-bold text-text-primary font-sf-mono">
                {participantCount}
              </p>
              <p className="text-sm text-text-secondary">/ {site.maxCapacity}</p>
            </div>
            {/* Capacity bar */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-blue rounded-full transition-all duration-300"
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-text-tertiary">Type</p>
            <div className="flex items-center gap-8">
              <div className="p-8 bg-accent-blue/20 rounded-glass">
                <svg className="w-5 h-5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-text-primary capitalize">
                {site.siteType}
              </p>
            </div>
          </div>
        </div>

        {/* Supervisor */}
        <div className="flex items-center gap-12 pt-12 border-t border-white/10">
          <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-sm text-text-secondary">{site.supervisorName}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-8">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(site);
            }}
            className="flex-1"
          >
            Edit
          </Button>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView(site);
            }}
            className="flex-1"
          >
            View Details
          </Button>
        </div>
      </div>
    </GlassCard>
  );
};
