import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: string;
  icon?: LucideIcon;
  imageSrc?: string;
  imageAlt?: string;
  mediaClassName?: string;
  valueClassName?: string;
}

export function SummaryCard({ title, value, icon: Icon, imageSrc, imageAlt, mediaClassName, valueClassName }: SummaryCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between p-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn('mt-3 text-4xl font-extrabold tracking-tight md:text-[2.5rem]', valueClassName)}>{value}</p>
        </div>
        <div className={cn('rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/15 to-orange-200/40 p-3 text-primary', mediaClassName)}>
          {imageSrc ? (
            <img alt={imageAlt ?? title} className="size-8 object-contain" src={imageSrc} />
          ) : Icon ? (
            <Icon className="size-5" />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
