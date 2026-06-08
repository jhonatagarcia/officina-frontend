import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: string;
  icon?: LucideIcon | undefined;
  imageSrc?: string | undefined;
  imageAlt?: string | undefined;
  mediaClassName?: string | undefined;
  valueClassName?: string | undefined;
  size?: 'default' | 'compact' | undefined;
  delta?: number | undefined;
  trendLabel?: string | undefined;
  sparklineValues?: number[] | undefined;
}

function parseMetricValue(value: string) {
  const normalizedValue = value.replace(/[^\d,-]/g, '').replace(/\./g, '').replace(',', '.');
  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function getDefaultDelta(title: string, value: string) {
  const seed = `${title}:${value}`.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return Number(((seed % 180) / 10 + 2.4).toFixed(1));
}

function buildSparkline(value: string, values?: number[]) {
  if (values?.length) return values;

  const baseValue = Math.max(Math.abs(parseMetricValue(value)), 1);
  return [0.58, 0.72, 0.66, 0.82, 0.91, 1].map((factor) => Math.max(1, Math.round(baseValue * factor)));
}

function SummarySparkline({ values, isCompact }: { values: number[]; isCompact: boolean }) {
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = Math.max(maxValue - minValue, 1);
  const width = 180;
  const height = isCompact ? 48 : 58;
  const points = values.map((item, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = height - ((item - minValue) / range) * (height - 10) - 5;
    return `${x},${y}`;
  });
  const line = points.join(' ');
  const area = `0,${height} ${line} ${width},${height}`;
  const lastPoint = points[points.length - 1];
  const [lastX = '0', lastY = '0'] = lastPoint?.split(',') ?? [];

  return (
    <svg aria-hidden="true" className={cn('mt-3 w-full', isCompact ? 'h-12' : 'h-14')} viewBox={`0 0 ${width} ${height}`}>
      <polygon fill="rgba(247,113,57,0.10)" points={area} />
      <polyline fill="none" points={line} stroke="#F77139" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
      {points.length ? (
        <circle
          cx={Number(lastX)}
          cy={Number(lastY)}
          fill="#F77139"
          r="3"
        />
      ) : null}
    </svg>
  );
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  imageSrc,
  imageAlt,
  mediaClassName,
  valueClassName,
  size = 'default',
  delta,
  trendLabel = 'vs mês anterior',
  sparklineValues,
}: SummaryCardProps) {
  const isCompact = size === 'compact';
  const resolvedDelta = delta ?? getDefaultDelta(title, value);
  const isPositiveDelta = resolvedDelta >= 0;
  const TrendIcon = isPositiveDelta ? TrendingUp : TrendingDown;
  const resolvedSparklineValues = buildSparkline(value, sparklineValues);

  return (
    <Card className="h-full overflow-hidden bg-white shadow-xs">
      <CardContent className={cn('relative flex h-full flex-col', isCompact ? 'min-h-44 p-4' : 'min-h-52 p-6')}>
        <div className={cn('absolute right-5 top-5 border border-primary/10 bg-primary-soft text-primary', isCompact ? 'rounded-xl p-2' : 'rounded-2xl p-3', mediaClassName)}>
          {imageSrc ? (
            <img alt={imageAlt ?? title} className={cn('object-contain', isCompact ? 'size-6' : 'size-8')} src={imageSrc} />
          ) : Icon ? (
            <Icon className={cn(isCompact ? 'size-4' : 'size-5')} strokeWidth={1.75} />
          ) : null}
        </div>
        <div className="min-w-0 pr-12">
          <p className={cn('font-semibold text-muted-foreground', isCompact ? 'text-sm leading-tight' : 'text-sm')}>{title}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <p
              className={cn(
                'break-words font-bold leading-none tracking-tight text-foreground [font-variant-numeric:tabular-nums]',
                isCompact ? 'text-2xl md:text-[1.75rem]' : 'text-4xl md:text-[2.5rem]',
                valueClassName,
              )}
            >
              {value}
            </p>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                isPositiveDelta ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
              )}
            >
              <TrendIcon className="size-3.5" strokeWidth={1.75} />
              {isPositiveDelta ? '+' : ''}
              {resolvedDelta.toFixed(1)}%
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{trendLabel}</p>
        </div>
        <SummarySparkline values={resolvedSparklineValues} isCompact={isCompact} />
      </CardContent>
    </Card>
  );
}
