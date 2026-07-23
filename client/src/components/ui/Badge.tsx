import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-[#E8F0F8] text-[#0A2E4A]',
      primary: 'bg-[#0A2E4A] text-white',
      success: 'bg-[#D1FAE5] text-[#065F46]',
      warning: 'bg-[#FEF3C7] text-[#92400E]',
      danger: 'bg-[#FEE2E2] text-[#991B1B]',
      info: 'bg-[#DBEAFE] text-[#1E40AF]',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-2.5 py-1 text-sm gap-1.5',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'default' && 'bg-[#0A2E4A]',
            variant === 'success' && 'bg-[#065F46]',
            variant === 'warning' && 'bg-[#92400E]',
            variant === 'danger' && 'bg-[#991B1B]',
            variant === 'info' && 'bg-[#1E40AF]',
            variant === 'primary' && 'bg-white'
          )} />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';