import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaptchaFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function CaptchaField({ value, onChange, error, disabled }: CaptchaFieldProps) {
  const checked = Boolean(value);

  return (
    <div>
      <button
        aria-checked={checked}
        role="checkbox"
        type="button"
        className={cn(
          'flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors',
          checked ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-white/10 bg-slate-800/80 text-slate-200',
          error ? 'border-destructive' : null,
          disabled ? 'cursor-not-allowed opacity-60' : null,
        )}
        disabled={disabled}
        onClick={() => onChange(checked ? '' : 'local-captcha-ok')}
      >
        <span className={cn('size-4 rounded border', checked ? 'border-emerald-600 bg-emerald-600' : 'border-current bg-transparent')} />
        <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
        <span>Não sou um robô</span>
      </button>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
