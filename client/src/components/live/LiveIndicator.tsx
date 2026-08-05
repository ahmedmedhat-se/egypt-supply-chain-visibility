import { useLiveStore } from '../../store/live.store';
import { cn } from '../../lib/utils';

/**
 * Small connection-status pill shown on every page: green "Live" while the
 * socket is connected, red "Offline" otherwise.
 */
export function LiveIndicator() {
  const connected = useLiveStore((state) => state.connected);

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-[1100] flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-lg transition-colors',
        connected
          ? 'border-[#2D9B6E]/40 bg-[#D1FAE5]/90 text-[#065F46] dark:bg-[#1F7A52]/90 dark:text-[#D1FAE5]'
          : 'border-[#FCA5A5]/60 bg-[#FEE2E2]/90 text-[#991B1B] dark:bg-[#7F1D1D]/90 dark:text-[#FCA5A5]',
      )}
    >
      <span className="relative flex h-2 w-2">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2D9B6E] opacity-75" />
        )}
        <span
          className={cn(
            'relative inline-flex h-2 w-2 rounded-full',
            connected ? 'bg-[#2D9B6E]' : 'bg-[#DC2626]',
          )}
        />
      </span>
      {connected ? 'Live' : 'Offline'}
    </div>
  );
}