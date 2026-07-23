import { cn } from '../../lib/utils';

interface DividerProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  label?: string;
}

export const Divider = ({ className, orientation = 'horizontal', variant = 'solid', label }: DividerProps) => {
  const variants = {
    solid: 'border-[#E2E8F0]',
    dashed: 'border-dashed border-[#E2E8F0]',
    dotted: 'border-dotted border-[#E2E8F0]',
  };

  if (orientation === 'vertical') {
    return (
      <div className={cn('h-full w-px', variants[variant], className)} />
    );
  }

  if (label) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className={cn('flex-1 border-t', variants[variant])} />
        <span className="text-sm text-[#94A3B8] font-medium whitespace-nowrap">{label}</span>
        <div className={cn('flex-1 border-t', variants[variant])} />
      </div>
    );
  }

  return <div className={cn('border-t', variants[variant], className)} />;
};