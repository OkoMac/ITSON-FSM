import React from 'react';
import { cn } from '@/utils/cn';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface OnboardingStepperProps {
  steps: Step[];
  currentStep: number;
}

export const OnboardingStepper: React.FC<OnboardingStepperProps> = ({
  steps,
  currentStep,
}) => {
  return (
    <div className="mb-32">
      <div className="relative">
        {/* Progress bar */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-white/10 rounded-full">
          <div
            className="h-full bg-accent-blue rounded-full transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center"
                style={{ width: `${100 / steps.length}%` }}
              >
                {/* Circle */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 mb-8',
                    'border-2',
                    isCompleted && 'bg-status-success border-status-success',
                    isActive && 'bg-accent-blue border-accent-blue animate-pulse-glow',
                    !isActive && !isCompleted && 'bg-white/10 border-white/20'
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isActive ? 'text-white' : 'text-text-tertiary'
                      )}
                    >
                      {step.id}
                    </span>
                  )}
                </div>

                {/* Label */}
                <div className="text-center hidden md:block">
                  <p
                    className={cn(
                      'text-sm font-medium mb-1',
                      isActive ? 'text-text-primary' : 'text-text-secondary'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-text-tertiary">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile step indicator */}
      <div className="md:hidden mt-16 text-center">
        <p className="text-sm font-medium text-text-primary mb-1">
          {steps[currentStep - 1]?.title}
        </p>
        <p className="text-xs text-text-secondary">
          Step {currentStep} of {steps.length}
        </p>
      </div>
    </div>
  );
};
