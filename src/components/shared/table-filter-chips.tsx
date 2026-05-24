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
    <div className="flex flex-wrap gap-2 border-b border-border-soft p-4">
      {options.map((option) => {
        const isActive = value === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              'inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold shadow-xs transition',
              isActive
                ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                : 'border-border bg-white text-muted-foreground hover:border-border-strong hover:text-foreground',
            )}
            onClick={() => onChange(option.value)}
          >
            <Icon
              className={cn(
                'size-4',
                !isActive && option.tone === 'emerald' && 'text-emerald-600',
                !isActive && option.tone === 'amber' && 'text-amber-600',
                !isActive && option.tone === 'rose' && 'text-rose-700',
                !isActive && option.tone === 'sky' && 'text-sky-600',
              )}
              strokeWidth={1.75}
            />
            {option.label}
            <span className={cn('rounded-full px-2 py-0.5 text-xs', isActive ? 'bg-white/15 text-white' : 'bg-stone-100 text-muted-foreground')}>
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
