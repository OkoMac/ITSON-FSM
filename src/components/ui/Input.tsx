import React, { useState } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      icon,
      iconPosition = 'left',
      className,
      id,
      placeholder,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const isFloating = isFocused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    return (
      <div className="relative w-full">
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-16 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none z-10">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'input-field peer',
              icon && iconPosition === 'left' && 'pl-48',
              icon && iconPosition === 'right' && 'pr-48',
              error && 'input-error',
              success && 'input-success',
              className
            )}
            placeholder={isFloating ? placeholder : ''}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />

          <label
            htmlFor={inputId}
            className={cn(
              'absolute left-16 transition-all duration-200 pointer-events-none',
              icon && iconPosition === 'left' && 'left-48',
              isFloating
                ? 'top-2 text-xs text-text-secondary'
                : 'top-1/2 -translate-y-1/2 text-base text-text-tertiary',
              error && 'text-status-error',
              success && 'text-status-success'
            )}
          >
            {label}
          </label>

          {icon && iconPosition === 'right' && (
            <div className="absolute right-16 top-1/2 -translate-y-1/2">
              {success && !error ? (
                <svg
                  className="w-5 h-5 text-status-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : error ? (
                <svg
                  className="w-5 h-5 text-status-error"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                icon
              )}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p
            className={cn(
              'mt-4 text-xs',
              error ? 'text-status-error' : 'text-text-secondary'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
