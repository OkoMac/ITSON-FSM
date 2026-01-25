import React from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className,
  ...props
}) => {
  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
    default: 'badge bg-white/10 text-text-primary border border-white/20',
  };

  const sizeClasses = {
    sm: 'text-xs px-8 py-2',
    md: 'text-xs px-12 py-4',
    lg: 'text-sm px-16 py-6',
  };

  return (
    <span
      className={cn(variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};
