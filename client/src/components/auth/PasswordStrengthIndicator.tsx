// src/components/auth/PasswordStrengthIndicator.tsx
import { useMemo } from 'react';
import { cn } from '../../lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator = ({ password, className }: PasswordStrengthIndicatorProps) => {
  const { strength, feedback } = useMemo(() => {
    if (!password) {
      return { strength: 0, feedback: '' };
    }

    let score = 0;
    let feedbackText = '';

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (password.length < 8) {
      feedbackText = 'Too short. Use at least 8 characters.';
    } else if (score <= 2) {
      feedbackText = 'Weak - add uppercase, numbers, or special characters.';
    } else if (score <= 4) {
      feedbackText = 'Fair - could be stronger.';
    } else if (score <= 6) {
      feedbackText = 'Strong password!';
    } else {
      feedbackText = 'Very strong! Great password.';
    }

    return { strength: Math.min(score, 6), feedback: feedbackText };
  }, [password]);

  const getColor = () => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 4) return 'bg-yellow-500';
    if (strength <= 5) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (strength <= 2) return 'text-red-500';
    if (strength <= 4) return 'text-yellow-600';
    if (strength <= 5) return 'text-blue-500';
    return 'text-green-500';
  };

  if (!password) return null;

  return (
    <div className={cn('mt-1.5', className)}>
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-full transition-all duration-300',
              i <= strength ? getColor() : 'bg-gray-200 dark:bg-gray-700'
            )}
          />
        ))}
      </div>
      <p className={cn('text-xs mt-1.5 font-medium', getTextColor())}>
        {feedback}
      </p>
    </div>
  );
};