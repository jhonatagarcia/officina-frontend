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
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {actionLabel ? <Button onClick={onAction}>{actionLabel}</Button> : null}
      </div>
    </div>
  );
}
