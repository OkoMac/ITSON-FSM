import React from 'react';
import { cn } from '@/utils/cn';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'hover';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}) => {
  const variantClasses = {
    default: 'glass-card',
    elevated: 'glass-card-elevated',
    hover: 'glass-card-hover',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-12',
    md: 'p-16 md:p-24',
    lg: 'p-24 md:p-32',
  };

  return (
    <div
      className={cn(variantClasses[variant], paddingClasses[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
};
