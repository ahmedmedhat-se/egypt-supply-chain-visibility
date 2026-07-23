import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white dark:bg-[#1A3D5A]',
      bordered: 'bg-white dark:bg-[#1A3D5A] border border-[#E2E8F0] dark:border-[#1A3D5A]',
      elevated: 'bg-white dark:bg-[#1A3D5A] shadow-lg hover:shadow-xl transition-shadow duration-300',
      gradient: 'bg-gradient-to-br from-[#0A2E4A] to-[#1A3D5A] text-white',
    };

    const paddings = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-7',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl',
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';