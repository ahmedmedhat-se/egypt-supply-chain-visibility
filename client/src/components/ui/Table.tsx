import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export const Table = ({ children, className }: TableProps) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full text-sm', className)}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children }: { children: ReactNode }) => {
  return (
    <thead className="bg-[#E8F0F8] text-[#0A2E4A]">
      <tr>{children}</tr>
    </thead>
  );
};

export const TableBody = ({ children }: { children: ReactNode }) => {
  return <tbody className="divide-y divide-[#E2E8F0]">{children}</tbody>;
};

export const TableRow = ({ children, className }: { children: ReactNode; className?: string }) => {
  return <tr className={cn('hover:bg-[#F1F4F8] transition-colors', className)}>{children}</tr>;
};

export const TableHead = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <th className={cn('px-4 py-3 text-left font-semibold', className)}>
      {children}
    </th>
  );
};

export const TableCell = ({ children, className, ...props }: { children: ReactNode; className?: string; colSpan?: number }) => {
  return <td className={cn('px-4 py-3 text-[#1A2A3A]', className)} {...props}>{children}</td>;
};