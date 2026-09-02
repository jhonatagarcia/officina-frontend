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
    <div className="relative min-w-0 overflow-hidden rounded-[18px] border border-border bg-[linear-gradient(105deg,#FFFFFF_0%,#FFFFFF_55%,#FFF4EB_88%,#FFE9D8_100%)] px-4 py-4 shadow-xs dark:bg-[linear-gradient(105deg,#1a1a20_0%,#1a1a20_55%,#1e0f07_88%,#231408_100%)] sm:rounded-[20px] sm:px-5 sm:py-5 md:px-6">
      <div className="relative flex min-w-0 flex-col gap-4">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-primary">Workspace</p>
          <h1 className="mt-2 break-words text-2xl font-bold leading-tight sm:text-[1.75rem]">{title}</h1>
          {description ? <p className="mt-2 text-[15px] leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2.5 [&>*]:min-w-0 [&>button]:w-full sm:flex-row sm:flex-wrap sm:items-center sm:[&>button]:w-auto sm:[&>div]:flex-1">
          {children}
          {actionLabel ? <Button onClick={onAction} className="w-full shrink-0 rounded-2xl px-5 sm:w-auto">{actionLabel}</Button> : null}
        </div>
      </div>
    </div>
  );
}
