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
    <div className="relative overflow-hidden rounded-[24px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,248,244,0.88))] px-5 py-5 shadow-[0_16px_44px_rgba(15,23,42,0.07)] md:px-6">
      <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(251,146,60,0.16),transparent_58%)]" />
      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/75">Workspace</p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight md:text-[1.75rem]">{title}</h1>
          {description ? <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{description}</p> : null}
        </div>
        <div className="flex w-full flex-col gap-2.5 xl:w-auto xl:flex-row xl:flex-nowrap xl:items-center xl:justify-end">
          {children}
          {actionLabel ? <Button onClick={onAction} className="shrink-0 rounded-2xl px-5">{actionLabel}</Button> : null}
        </div>
      </div>
    </div>
  );
}
