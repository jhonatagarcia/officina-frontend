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
}

export function SummaryCard({ title, value, icon: Icon, imageSrc, imageAlt, mediaClassName }: SummaryCardProps) {
  return (
    <Card className="shadow-panel">
      <CardContent className="flex items-start justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-3 text-4xl font-extrabold tracking-tight">{value}</p>
        </div>
        <div className={cn('rounded-xl bg-primary/10 p-3 text-primary', mediaClassName)}>
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
