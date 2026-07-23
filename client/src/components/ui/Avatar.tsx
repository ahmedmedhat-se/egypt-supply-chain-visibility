import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { FaUser } from 'react-icons/fa';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, size = 'md', fallback, status, ...props }, ref) => {
    const sizes = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-2xl',
    };

    const statusColors = {
      online: 'bg-[#2D9B6E]',
      offline: 'bg-[#94A3B8]',
      away: 'bg-[#F59E0B]',
      busy: 'bg-[#DC2626]',
    };

    const statusSizes = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4',
    };

    return (
      <div ref={ref} className={cn('relative inline-block', className)} {...props}>
        <div className={cn(
          'rounded-full overflow-hidden bg-[#E8F0F8] flex items-center justify-center',
          sizes[size]
        )}>
          {src ? (
            <img src={src} alt={alt || 'Avatar'} className="w-full h-full object-cover" />
          ) : fallback ? (
            <span className="font-medium text-[#0A2E4A]">{fallback}</span>
          ) : (
            <FaUser className="text-[#94A3B8]" />
          )}
        </div>
        {status && (
          <span className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
            statusColors[status],
            statusSizes[size]
          )} />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';