import { PropsWithChildren } from 'react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps extends PropsWithChildren {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function PageHeader({ title, description, actionLabel, onAction, children }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,248,244,0.88))] px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(251,146,60,0.16),transparent_58%)]" />
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/75">Workspace</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-[2rem]">{title}</h1>
          {description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row xl:flex-nowrap xl:items-center xl:justify-end">
          {children}
          {actionLabel ? <Button onClick={onAction} className="shrink-0 rounded-2xl px-5">{actionLabel}</Button> : null}
        </div>
      </div>
    </div>
  );
}
