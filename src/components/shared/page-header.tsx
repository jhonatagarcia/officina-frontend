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
    <div className="relative overflow-hidden rounded-[20px] border border-border bg-[linear-gradient(105deg,#FFFFFF_0%,#FFFFFF_55%,#FFF4EB_88%,#FFE9D8_100%)] px-5 py-5 shadow-xs md:px-6">
      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-primary">Workspace</p>
          <h1 className="mt-2 text-[1.75rem] font-bold leading-tight">{title}</h1>
          {description ? <p className="mt-2 text-[15px] leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        <div className="flex w-full flex-col gap-2.5 xl:w-auto xl:flex-row xl:flex-nowrap xl:items-center xl:justify-end">
          {children}
          {actionLabel ? <Button onClick={onAction} className="shrink-0 rounded-2xl px-5">{actionLabel}</Button> : null}
        </div>
      </div>
    </div>
  );
}
