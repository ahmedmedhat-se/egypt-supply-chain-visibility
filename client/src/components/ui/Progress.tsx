import { cn } from '../../lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Progress = ({
  value,
  max = 100,
  label,
  showValue = false,
  variant = 'default',
  size = 'md',
  className,
}: ProgressProps) => {
  const percentage = Math.min(100, (value / max) * 100);

  const variants = {
    default: 'bg-[#0A2E4A]',
    success: 'bg-[#2D9B6E]',
    warning: 'bg-[#F59E0B]',
    danger: 'bg-[#DC2626]',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4 rounded-lg',
  };

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm font-medium text-[#1A2A3A]">{label}</span>}
          {showValue && <span className="text-sm font-medium text-[#94A3B8]">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-[#E8F0F8] rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn(
            'transition-all duration-500 ease-out rounded-full',
            variants[variant],
            sizes[size]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};