import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableFilterChipOption<TValue extends string> {
  value: TValue;
  label: string;
  count: number;
  icon: LucideIcon;
  tone?: 'slate' | 'emerald' | 'amber' | 'rose' | 'sky';
}

interface TableFilterChipsProps<TValue extends string> {
  value: TValue;
  options: TableFilterChipOption<TValue>[];
  onChange: (value: TValue) => void;
}

export function TableFilterChips<TValue extends string>({ value, options, onChange }: TableFilterChipsProps<TValue>) {
  return (
    <div className="responsive-scroll flex gap-2 overflow-x-auto border-b border-border-soft p-3 sm:flex-wrap sm:overflow-visible sm:p-4">
      {options.map((option) => {
        const isActive = value === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold shadow-xs transition',
              isActive
                ? 'border-primary bg-primary text-white shadow-md'
                : 'border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground',
            )}
            onClick={() => onChange(option.value)}
          >
            <Icon
              className={cn(
                'size-4',
                !isActive && option.tone === 'emerald' && 'text-emerald-500',
                !isActive && option.tone === 'amber' && 'text-amber-500',
                !isActive && option.tone === 'rose' && 'text-rose-500',
                !isActive && option.tone === 'sky' && 'text-sky-500',
              )}
              strokeWidth={1.75}
            />
            {option.label}
            <span className={cn('rounded-full px-2 py-0.5 text-xs', isActive ? 'bg-white/15 text-white' : 'bg-muted text-muted-foreground')}>
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
