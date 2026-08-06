import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'gradient' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default', 
    padding = 'md', 
    hoverable = false,
    interactive = false,
    children, 
    ...props 
  }, ref) => {
    const variants = {
      default: 'bg-white dark:bg-[#111111]',
      bordered: 'bg-white dark:bg-[#111111] border-2 border-[#E2E8F0] dark:border-[#2A2A2A]',
      elevated: 'bg-white dark:bg-[#111111] shadow-md hover:shadow-xl transition-shadow duration-300',
      gradient: 'bg-gradient-to-br from-[#0A2E4A] via-[#1A3D5A] to-[#2D5A7A] dark:from-black dark:via-[#0A0A0A] dark:to-[#1A1A1A] text-white',
      glass: 'bg-white/80 dark:bg-black/80 backdrop-blur-lg border border-white/20 dark:border-white/10',
    };

    const paddings = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-7',
      xl: 'p-9',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-300',
          variants[variant],
          paddings[padding],
          hoverable && 'hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-2xl',
          interactive && 'cursor-pointer hover:border-[#2D9B6E] dark:hover:border-[#2D9B6E]',
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