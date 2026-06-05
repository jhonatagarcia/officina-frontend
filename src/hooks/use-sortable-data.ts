import { useMemo, useState } from 'react';
import type { SortState } from '@/components/ui/table';

type SortableValue = string | number | boolean | Date | null | undefined;
type Accessors<TItem> = Record<string, (item: TItem) => SortableValue>;
type AccessorColumn<TAccessors> = Extract<keyof TAccessors, string>;

interface UseSortableDataOptions<TItem, TAccessors extends Accessors<TItem>> {
  accessors: TAccessors;
  initialSort: SortState<AccessorColumn<TAccessors>>;
}

const collator = new Intl.Collator('pt-BR', {
  numeric: true,
  sensitivity: 'base',
});

function normalizeValue(value: SortableValue) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function compareValues(left: SortableValue, right: SortableValue) {
  const normalizedLeft = normalizeValue(left);
  const normalizedRight = normalizeValue(right);

  if (typeof normalizedLeft === 'number' && typeof normalizedRight === 'number') {
    return normalizedLeft - normalizedRight;
  }

  return collator.compare(String(normalizedLeft), String(normalizedRight));
}

export function useSortableData<TItem, TAccessors extends Accessors<TItem>>(
  items: TItem[],
  { accessors, initialSort }: UseSortableDataOptions<TItem, TAccessors>,
) {
  const [sortState, setSortState] = useState<SortState<AccessorColumn<TAccessors>>>(initialSort);

  const sortedItems = useMemo(() => {
    const accessor = accessors[sortState.column];

    return [...items].sort((left, right) => {
      const result = compareValues(accessor(left), accessor(right));
      return sortState.direction === 'asc' ? result : -result;
    });
  }, [accessors, items, sortState]);

  function requestSort(column: AccessorColumn<TAccessors>) {
    setSortState((current) =>
      current.column === column
        ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' },
    );
  }

  return {
    sortState,
    sortedItems,
    requestSort,
  };
}
