import { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** Number of page buttons to render around the current page */
  siblingCount?: number;
}

const pageBtn =
  'min-w-8 h-8 px-2 rounded-lg border border-[#E2E8F0] dark:border-[#1A3D5A] ' +
  'text-xs font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center justify-center ' +
  'transition-colors hover:bg-[#E8F0F8] dark:hover:bg-[#1A3D5A] ' +
  'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent';

export const Pagination = ({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  className,
  siblingCount = 1,
}: PaginationProps) => {
  // Keep the page in range if the dataset shrank (filter, delete, etc.)
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      onPageChange(totalPages);
    } else if (totalItems === 0 && page !== 1) {
      onPageChange(1);
    }
  }, [page, totalPages, totalItems, onPageChange]);

  const start = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalItems);

  const from = Math.max(1, page - siblingCount);
  const to = Math.min(totalPages, page + siblingCount);
  const pages: number[] = [];
  for (let p = from; p <= to; p++) pages.push(p);

  // Nothing to page through — render nothing
  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3',
        className,
      )}
    >
      <p className="text-sm text-[#94A3B8]">
        Showing{' '}
        <span className="font-medium text-[#1A2A3A] dark:text-white">
          {start}
        </span>
        –<span className="font-medium text-[#1A2A3A] dark:text-white">{end}</span>{' '}
        of{' '}
        <span className="font-medium text-[#1A2A3A] dark:text-white">
          {totalItems}
        </span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={pageBtn}
          aria-label="Previous page"
        >
          <FaChevronLeft className="w-3 h-3" />
        </button>

        {from > 1 && (
          <>
            <button type="button" onClick={() => onPageChange(1)} className={pageBtn}>
              1
            </button>
            {from > 2 && <span className="px-1 text-xs text-[#94A3B8]">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              pageBtn,
              p === page &&
                'bg-[#0A2E4A] dark:bg-[#2D9B6E] border-[#0A2E4A] dark:border-[#2D9B6E] text-white dark:text-white',
            )}
          >
            {p}
          </button>
        ))}

        {to < totalPages && (
          <>
            {to < totalPages - 1 && <span className="px-1 text-xs text-[#94A3B8]">…</span>}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className={pageBtn}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={pageBtn}
          aria-label="Next page"
        >
          <FaChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
