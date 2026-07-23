import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'white';
}

export const LoadingSpinner = ({ size = 'md', className, variant = 'default' }: LoadingSpinnerProps) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const variants = {
    default: 'border-[#0A2E4A] border-t-transparent',
    white: 'border-white border-t-transparent',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          'animate-spin rounded-full',
          sizes[size],
          variants[variant],
          className
        )}
      />
    </div>
  );
};