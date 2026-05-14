import * as React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full caption-bottom text-sm', className)} {...props} />;
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-b transition-colors hover:bg-secondary/45', className)} {...props} />;
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground', className)} {...props} />;
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3.5 align-middle', className)} {...props} />;
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

  return (
    <TableHead className={className} {...props}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-2 rounded-md text-left font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className?.includes('text-right') ? 'ml-auto flex' : undefined,
        )}
        onClick={() => onSort(column)}
      >
        <span>{children}</span>
        <Icon className="size-4 shrink-0" />
      </button>
    </TableHead>
  );
}
