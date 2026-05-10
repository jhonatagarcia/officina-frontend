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
  size?: 'default' | 'compact';
}

export function SummaryCard({ title, value, icon: Icon, imageSrc, imageAlt, mediaClassName, valueClassName, size = 'default' }: SummaryCardProps) {
  const isCompact = size === 'compact';

  return (
    <Card className="overflow-hidden">
      <CardContent className={cn('flex items-start justify-between', isCompact ? 'gap-3 p-4' : 'p-6')}>
        <div>
          <p className={cn('font-medium text-muted-foreground', isCompact ? 'text-xs leading-tight' : 'text-sm')}>{title}</p>
          <p className={cn('font-extrabold tracking-tight', isCompact ? 'mt-2 text-3xl md:text-[2rem]' : 'mt-3 text-4xl md:text-[2.5rem]', valueClassName)}>{value}</p>
        </div>
        <div className={cn('border border-primary/10 bg-gradient-to-br from-primary/15 to-orange-200/40 text-primary', isCompact ? 'rounded-xl p-2' : 'rounded-2xl p-3', mediaClassName)}>
          {imageSrc ? (
            <img alt={imageAlt ?? title} className={cn('object-contain', isCompact ? 'size-6' : 'size-8')} src={imageSrc} />
          ) : Icon ? (
            <Icon className={cn(isCompact ? 'size-4' : 'size-5')} />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
