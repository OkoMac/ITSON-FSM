/**
 * Metric Card Component
 *
 * Displays a key metric with trend indicator
 */

import React from 'react';
import { cn } from '@/utils/cn';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  trend?: 'up' | 'down' | 'stable';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = 'blue',
  trend,
}) => {
  const colorClasses = {
    blue: 'text-accent-blue bg-accent-blue/10',
    green: 'text-success bg-success/10',
    amber: 'text-warning bg-warning/10',
    red: 'text-error bg-error/10',
    purple: 'text-purple-400 bg-purple-400/10',
  };

  const getTrendColor = () => {
    if (!trend || trend === 'stable') return 'text-text-secondary';
    return trend === 'up' ? 'text-success' : 'text-error';
  };

  const getTrendIcon = () => {
    if (!trend || trend === 'stable') {
      return (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      );
    }

    if (trend === 'up') {
      return (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      );
    }

    return (
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
        />
      </svg>
    );
  };

  return (
    <div className="glass-card rounded-glass p-20 hover:scale-105 transition-transform">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-text-secondary mb-8">{title}</p>
          <p className="text-3xl font-bold text-text-primary mb-12">{value}</p>

          {(change !== undefined || changeLabel) && (
            <div className="flex items-center space-x-8">
              {change !== undefined && (
                <div className={cn('flex items-center space-x-4', getTrendColor())}>
                  {getTrendIcon()}
                  <span className="text-sm font-medium">
                    {change > 0 && '+'}
                    {change.toFixed(1)}%
                  </span>
                </div>
              )}
              {changeLabel && (
                <span className="text-xs text-text-secondary">{changeLabel}</span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div className={cn('p-12 rounded-glass', colorClasses[color])}>{icon}</div>
        )}
      </div>
    </div>
  );
};
