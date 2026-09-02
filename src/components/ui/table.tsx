import * as React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full caption-bottom text-sm sm:text-base', className)} {...props} />;
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-b transition-colors hover:bg-stone-50/80', className)} {...props} />;
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('h-12 px-3 text-left align-middle text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground sm:h-14 sm:px-6 sm:text-[13px] sm:tracking-[0.1em]', className)} {...props} />;
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-3 py-4 align-middle text-sm sm:px-6 sm:py-5 sm:text-base', className)} {...props} />;
}

export type SortDirection = 'asc' | 'desc';

export interface SortState<TColumn extends string> {
  column: TColumn;
  direction: SortDirection;
}

interface SortableTableHeadProps<TColumn extends string> extends React.ThHTMLAttributes<HTMLTableCellElement> {
  column: TColumn;
  sortState: SortState<TColumn>;
  onSort: (column: TColumn) => void;
}

export function SortableTableHead<TColumn extends string>({
  children,
  className,
  column,
  sortState,
  onSort,
  ...props
}: SortableTableHeadProps<TColumn>) {
  const isActive = sortState.column === column;
  const Icon = !isActive ? ArrowUpDown : sortState.direction === 'asc' ? ArrowUp : ArrowDown;
  const ariaSort = !isActive ? 'none' : sortState.direction === 'asc' ? 'ascending' : 'descending';

  return (
    <TableHead aria-sort={ariaSort} className={className} {...props}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-2 rounded-md text-left font-bold uppercase tracking-[0.1em] transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className?.includes('text-right') ? 'ml-auto flex' : undefined,
        )}
        onClick={() => onSort(column)}
      >
        <span>{children}</span>
        <Icon aria-hidden="true" className="size-4 shrink-0" />
      </button>
    </TableHead>
  );
}
