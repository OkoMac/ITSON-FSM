import React from 'react';
import { cn } from '@/utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'title' | 'avatar' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className,
  style,
  ...props
}) => {
  const variantClasses = {
    text: 'skeleton-text',
    title: 'skeleton-title',
    avatar: 'skeleton-avatar w-12 h-12',
    rectangular: 'skeleton rounded',
    circular: 'skeleton rounded-full',
  };

  return (
    <div
      className={cn(variantClasses[variant], className)}
      style={{
        width: width || undefined,
        height: height || undefined,
        ...style,
      }}
      {...props}
    />
  );
};

export const SkeletonGroup: React.FC<{ count?: number; children: React.ReactNode }> = ({
  count = 3,
  children,
}) => {
  return (
    <div className="space-y-16">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{children}</div>
      ))}
    </div>
  );
};
