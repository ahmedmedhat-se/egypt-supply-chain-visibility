import { type ReactNode, type ComponentType, createElement } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }> | ReactNode;
  action?: ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  title,
  description,
  icon,
  action,
  actionText,
  onAction,
  className,
}: EmptyStateProps) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center p-8',
      className
    )}>
      {icon && (
        <div className="text-[#94A3B8] text-5xl mb-4">
          {typeof icon === 'function'
            ? createElement(icon as ComponentType<{ className?: string }>)
            : icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#0A2E4A]">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-[#94A3B8] max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
      {actionText && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};