import { useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BellRing,
  CalendarDays,
  ClipboardList,
  DollarSign,
  Gauge,
  HardHat,
  PackageCheck,
  PackageSearch,
  Plus,
  Receipt,
  Settings2,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '@/features/dashboard/services/dashboard-service';
import { useSortableData } from '@/hooks/use-sortable-data';
import { useAnimatedNumber } from '@/hooks/use-animated-number';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { PlateChip, VehicleIdentityCell } from '@/components/shared/table-identity-cells';
import { Badge } from '@/components/ui/badge';
import { CustomizableWidgetGrid } from '@/components/shared/customizable-widgets';
import { Pagination } from '@/components/shared/pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SortableTableHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, formatCurrency, formatDateOnly, formatServiceOrderNumber } from '@/lib/utils';
import type { DashboardOperationalAlert, DashboardPeriod } from '@/features/dashboard/types';

const ACTIVE_SERVICE_ORDERS_PAGE_SIZE = 4;
const DASHBOARD_SECONDARY_TABLE_PAGE_SIZE = 5;
type MetricTone = 'orange' | 'green' | 'red' | 'blue' | 'amber' | 'slate';

const dashboardPeriodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 'WEEK', label: 'Semanal' },
  { value: 'MONTH', label: 'Mensal' },
  { value: 'BIMESTER', label: 'Bimestre' },
  { value: 'TRIMESTER', label: 'Trimestre' },
  { value: 'YEAR', label: 'Anual' },
];

const dashboardPeriodLabels: Record<DashboardPeriod, string> = {
  WEEK: 'últimos 7 dias',
  MONTH: 'últimos 30 dias',
  BIMESTER: 'últimos 2 meses',
  TRIMESTER: 'últimos 3 meses',
  YEAR: 'últimos 12 meses',
};

const toneMap: Record<MetricTone, { text: string; soft: string; line: string; fill: string; bar: string }> = {
  orange: {
    text: 'text-primary',
    soft: 'bg-primary-soft',
    line: '#F77139',
    fill: 'rgba(247,113,57,0.10)',
    bar: 'bg-primary',
  },
  green: {
    text: 'text-emerald-500',
    soft: 'bg-emerald-500/10',
    line: '#16A34A',
    fill: 'rgba(22,163,74,0.10)',
    bar: 'bg-emerald-500',
  },
  red: {
    text: 'text-red-500',
    soft: 'bg-red-500/10',
    line: '#DC2626',
    fill: 'rgba(220,38,38,0.10)',
    bar: 'bg-red-500',
  },
  blue: {
    text: 'text-sky-500',
    soft: 'bg-sky-500/10',
    line: '#0EA5E9',
    fill: 'rgba(14,165,233,0.10)',
    bar: 'bg-sky-500',
  },
  amber: {
    text: 'text-amber-500',
    soft: 'bg-amber-500/10',
    line: '#F59E0B',
    fill: 'rgba(245,158,11,0.12)',
    bar: 'bg-amber-500',
  },
  slate: {
    text: 'text-slate-400',
    soft: 'bg-slate-500/10',
    line: '#94A3B8',
    fill: 'rgba(148,163,184,0.14)',
    bar: 'bg-slate-500',
  },
};

const alertVariantMap: Record<DashboardOperationalAlert['severity'], 'danger' | 'warning' | 'info'> = {
  danger: 'danger',
  warning: 'warning',
  info: 'info',
};

const alertLabelMap: Record<DashboardOperationalAlert['severity'], string> = {
  danger: 'Crítico',
  warning: 'Atenção',
  info: 'Monitoramento',
};

const alertContainerMap: Record<DashboardOperationalAlert['severity'], string> = {
  danger: 'border-rose-500/20 bg-rose-500/10',
  warning: 'border-amber-500/20 bg-amber-500/10',
  info: 'border-sky-500/20 bg-sky-500/10',
};

function formatPercent(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function getDeltaTone(value: number) {
  return value >= 0 ? 'green' : 'red';
}

function formatInteger(value: number) {
  return Math.round(value).toLocaleString('pt-BR');
}

function formatWithSuffix(suffix: string) {
  return (value: number) => `${formatInteger(value)} ${suffix}`;
}

function AnimatedValue({
  value,
  formatter = formatInteger,
}: {
  value: number;
  formatter?: (value: number) => string;
}) {
  const animated = useAnimatedNumber(value);
  return <>{formatter(animated)}</>;
}

function MiniSparkline({ values, tone = 'orange' }: { values: number[]; tone?: MetricTone }) {
  const animatedValues = [
    useAnimatedNumber(values[0] ?? 0),
    useAnimatedNumber(values[1] ?? 0),
    useAnimatedNumber(values[2] ?? 0),
    useAnimatedNumber(values[3] ?? 0),
    useAnimatedNumber(values[4] ?? 0),
    useAnimatedNumber(values[5] ?? 0),
  ];
  const maxValue = Math.max(...animatedValues, 1);
  const minValue = Math.min(...animatedValues, 0);
  const range = Math.max(maxValue - minValue, 1);
  const width = 220;
  const height = 72;
  const points = animatedValues.map((value, index) => {
    const x = (index / Math.max(animatedValues.length - 1, 1)) * width;
    const y = height - ((value - minValue) / range) * (height - 12) - 6;
    return { x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `0,${height} ${line} ${width},${height}`;
  const months = ['dez', 'jan', 'fev', 'mar', 'abr', 'mai'];
  const lastPoint = points[points.length - 1];

  return (
    <div className="mt-4">
      <svg aria-hidden="true" className="h-20 w-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <polygon fill={toneMap[tone].fill} points={area} />
        <polyline fill="none" points={line} stroke={toneMap[tone].line} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        {lastPoint ? <circle cx={lastPoint.x} cy={lastPoint.y} fill={toneMap[tone].line} r="3.2" /> : null}
      </svg>
      <div className="grid grid-cols-6 text-[11px] font-semibold text-muted-foreground/60">
        {months.map((month, index) => (
          <span key={month} className={index === months.length - 1 ? 'text-right text-primary' : undefined}>
            {month}
          </span>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  formatter = formatInteger,
  delta,
  subtitle = 'vs mês anterior',
  tone = 'orange',
  icon: Icon,
  sparkline,
}: {
  title: string;
  value: number;
  formatter?: (value: number) => string;
  delta?: number;
  subtitle?: string;
  tone?: MetricTone;
  icon: LucideIcon;
  sparkline?: number[];
}) {
  const deltaTone = getDeltaTone(delta ?? 0);

  return (
    <Card className="h-full overflow-hidden bg-card shadow-xs">
      <CardContent className="relative flex h-full min-h-44 flex-col p-5">
        <div className={cn('absolute right-6 top-6 rounded-xl p-2', toneMap[tone].soft, toneMap[tone].text)}>
          <Icon className="size-4" strokeWidth={1.75} />
        </div>
        <p className="pr-12 text-sm font-semibold text-muted-foreground">{title}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <p className="font-bold leading-none tracking-tight text-foreground text-[clamp(1.65rem,2.2vw,2.35rem)] [font-variant-numeric:tabular-nums]">
            <AnimatedValue value={value} formatter={formatter} />
          </p>
          {typeof delta === 'number' ? (
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold', toneMap[deltaTone].soft, toneMap[deltaTone].text)}>
              {delta >= 0 ? <TrendingUp className="size-3.5" strokeWidth={1.75} /> : <TrendingDown className="size-3.5" strokeWidth={1.75} />}
              {formatPercent(delta)}
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
        {sparkline ? <MiniSparkline values={sparkline} tone={tone} /> : null}
      </CardContent>
    </Card>
  );
}

function BarMetricCard({ title, value, values }: { title: string; value: number; values: number[] }) {
  const animatedValue = useAnimatedNumber(value);
  const animatedValues = [
    useAnimatedNumber(values[0] ?? 0),
    useAnimatedNumber(values[1] ?? 0),
    useAnimatedNumber(values[2] ?? 0),
    useAnimatedNumber(values[3] ?? 0),
    useAnimatedNumber(values[4] ?? 0),
    useAnimatedNumber(values[5] ?? 0),
  ];
  const maxValue = Math.max(...animatedValues, 1);
  const months = ['dez', 'jan', 'fev', 'mar', 'abr', 'mai'];

  return (
    <Card className="h-full bg-card shadow-xs">
      <CardContent className="p-5">
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        <div className="mt-8 flex items-center gap-3">
          <p className="text-3xl font-bold leading-none [font-variant-numeric:tabular-nums]">{formatInteger(animatedValue)}</p>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-500">
            <TrendingUp className="mr-1 inline size-3.5" strokeWidth={1.75} />
            +8.1%
          </span>
          <span className="text-xs font-medium text-muted-foreground">vs abr</span>
        </div>
        <div className="mt-8 grid h-56 grid-cols-6 items-end gap-7 border-b border-border-soft px-6">
          {animatedValues.map((item, index) => (
            <div key={index} className="flex h-full flex-col justify-end gap-3">
              <p className={cn('text-center text-xl font-bold', index === values.length - 1 ? 'text-foreground' : 'text-muted-foreground')}>
                {formatInteger(item)}
              </p>
              <div
                className={cn('rounded-t-lg', index === values.length - 1 ? toneMap.orange.bar : 'bg-slate-300')}
                style={{ height: `${Math.max(18, (item / maxValue) * 78)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-6 px-6 text-center text-sm font-semibold text-muted-foreground/70">
          {months.map((month, index) => (
            <span key={month} className={index === months.length - 1 ? 'text-primary' : undefined}>
              {month}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusDonutCard({
  openOrdersCount,
  inProgressOrdersCount,
  readyOrdersCount,
  pendingBudgetsCount,
}: {
  openOrdersCount: number;
  inProgressOrdersCount: number;
  readyOrdersCount: number;
  pendingBudgetsCount: number;
}) {
  const total = Math.max(openOrdersCount + inProgressOrdersCount + readyOrdersCount + pendingBudgetsCount, 1);
  const animatedTotal = useAnimatedNumber(total);
  const animatedReady = useAnimatedNumber(readyOrdersCount);
  const animatedInProgress = useAnimatedNumber(inProgressOrdersCount);
  const animatedPending = useAnimatedNumber(pendingBudgetsCount);
  const animatedOpen = useAnimatedNumber(openOrdersCount);
  const animatedSafeTotal = Math.max(animatedTotal, 1);
  const readyEnd = (animatedReady / animatedSafeTotal) * 100;
  const inProgressEnd = readyEnd + (animatedInProgress / animatedSafeTotal) * 100;
  const pendingEnd = inProgressEnd + (animatedPending / animatedSafeTotal) * 100;

  return (
    <Card className="h-full bg-card shadow-xs">
      <CardContent className="p-5">
        <p className="text-sm font-semibold text-muted-foreground">OS por status</p>
        <div className="mt-7 grid gap-6 md:grid-cols-[190px_1fr] md:items-center">
          <div
            className="relative mx-auto size-44 rounded-full"
            style={{
              background: `conic-gradient(#16A34A 0 ${readyEnd}%, #F59E0B ${readyEnd}% ${inProgressEnd}%, #0EA5E9 ${inProgressEnd}% ${pendingEnd}%, #A6A29A ${pendingEnd}% 100%)`,
            }}
          >
            <div className="absolute inset-10 flex flex-col items-center justify-center rounded-full bg-card">
              <span className="text-3xl font-bold [font-variant-numeric:tabular-nums]">{formatInteger(animatedTotal)}</span>
              <span className="text-sm text-muted-foreground">total</span>
            </div>
          </div>
          <div className="space-y-4">
            {[
              ['Prontas', animatedReady, 'bg-emerald-500'],
              ['Em andamento', animatedInProgress, 'bg-amber-500'],
              ['Orçamento', animatedPending, 'bg-sky-500'],
              ['Abertas', animatedOpen, 'bg-stone-400'],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div className="flex items-center gap-3">
                  <span className={cn('size-3 rounded', color)} />
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
                <span className="text-sm font-bold [font-variant-numeric:tabular-nums]">{formatInteger(Number(value))}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RankingCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; detail: string; value: string }>;
}) {
  return (
    <Card className="h-full bg-card shadow-xs">
      <CardContent className="p-5">
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        <div className="mt-8 space-y-0">
          {items.map((item, index) => (
            <div key={`${item.label}-${index}`} className="grid grid-cols-[24px_1fr_auto] items-center gap-3 border-b border-border-soft py-3 last:border-b-0">
              <span className="text-xs font-semibold text-muted-foreground/70">{index + 1}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{item.label}</p>
                <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
              </div>
              <p className="text-sm font-bold [font-variant-numeric:tabular-nums]">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DotStatusPill({ label, tone = 'amber' }: { label: string; tone?: MetricTone }) {
  const colorMap: Record<MetricTone, string> = {
    orange: 'bg-primary text-primary',
    green: 'bg-emerald-500 text-emerald-500',
    red: 'bg-red-500 text-red-500',
    blue: 'bg-sky-500 text-sky-500',
    amber: 'bg-amber-500 text-amber-500',
    slate: 'bg-slate-400 text-slate-400',
  };

  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold', toneMap[tone].soft, colorMap[tone].split(' ')[1])}>
      <span className={cn('dot size-2 rounded-full', colorMap[tone].split(' ')[0])} />
      {label}
    </span>
  );
}

function DashboardPeriodFilter({
  value,
  onChange,
}: {
  value: DashboardPeriod;
  onChange: (value: DashboardPeriod) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-border-soft bg-card p-4 shadow-xs">
      {dashboardPeriodOptions.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              'inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold shadow-xs transition',
              isActive
                ? 'border-primary bg-primary text-white shadow-md'
                : 'border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground',
            )}
            onClick={() => onChange(option.value)}
          >
            <CalendarDays className={cn('size-4', !isActive && 'text-sky-600')} strokeWidth={1.75} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function DashboardTableCard({
  id,
  title,
  description,
  actionLabel,
  onAction,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  actionLabel: string;
  onAction: () => void;
  children: ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-6 h-full overflow-hidden bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border-soft p-5">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <Button className="rounded-lg bg-card font-semibold" size="sm" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function DashboardTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[860px] text-base">
        {children}
      </Table>
    </div>
  );
}

function DashboardTableHead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <TableHead className={cn('h-14 px-6 text-[13px] font-bold tracking-[0.1em] text-muted-foreground', className)}>
      {children}
    </TableHead>
  );
}

function DashboardTableCell({ children, className }: { children: ReactNode; className?: string }) {
  return <TableCell className={cn('px-6 py-5 text-base', className)}>{children}</TableCell>;
}

function serviceOrderStatusTone(status: string): MetricTone {
  if (status === 'FINALIZADA' || status === 'ENTREGUE') return 'green';
  if (status === 'EM_ANDAMENTO') return 'amber';
  return 'blue';
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [isConfiguringPanel, setIsConfiguringPanel] = useState(false);
  const [dashboardPeriod, setDashboardPeriod] = useState<DashboardPeriod>('YEAR');
  const [activeServiceOrdersPage, setActiveServiceOrdersPage] = useState(1);
  const [pendingBudgetsPage, setPendingBudgetsPage] = useState(1);
  const [lowStockItemsPage, setLowStockItemsPage] = useState(1);
  const query = useQuery({
    queryKey: ['dashboard', dashboardPeriod],
    queryFn: () => dashboardService.getOverview(dashboardPeriod),
  });
  const activeServiceOrdersTotalPages = Math.max(1, Math.ceil((query.data?.activeServiceOrders.length ?? 0) / ACTIVE_SERVICE_ORDERS_PAGE_SIZE));
  const pendingBudgetsTotalPages = Math.max(1, Math.ceil((query.data?.pendingBudgets.length ?? 0) / DASHBOARD_SECONDARY_TABLE_PAGE_SIZE));
  const inventory = query.data?.inventory;
  const { sortedItems, sortState, requestSort } = useSortableData(inventory?.lowStockItems ?? [], {
    initialSort: { column: 'internalCode', direction: 'asc' },
    accessors: {
      internalCode: (item) => item.internalCode,
      name: (item) => item.name,
      quantity: (item) => item.quantity,
      minimumQuantity: (item) => item.minimumQuantity,
    },
  });
  const lowStockItemsTotalPages = Math.max(1, Math.ceil(sortedItems.length / DASHBOARD_SECONDARY_TABLE_PAGE_SIZE));

  useEffect(() => {
    setActiveServiceOrdersPage((page) => Math.min(page, activeServiceOrdersTotalPages));
    setPendingBudgetsPage((page) => Math.min(page, pendingBudgetsTotalPages));
    setLowStockItemsPage((page) => Math.min(page, lowStockItemsTotalPages));
  }, [activeServiceOrdersTotalPages, pendingBudgetsTotalPages, lowStockItemsTotalPages]);

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  const { serviceOrders, budgets, financial, inventory: inventoryData, activeServiceOrders, pendingBudgets, operationalAlerts } = query.data;
  const currentActiveServiceOrdersPage = Math.min(activeServiceOrdersPage, activeServiceOrdersTotalPages);
  const activeServiceOrdersStartIndex = (currentActiveServiceOrdersPage - 1) * ACTIVE_SERVICE_ORDERS_PAGE_SIZE;
  const paginatedActiveServiceOrders = activeServiceOrders.slice(activeServiceOrdersStartIndex, activeServiceOrdersStartIndex + ACTIVE_SERVICE_ORDERS_PAGE_SIZE);
  const currentPendingBudgetsPage = Math.min(pendingBudgetsPage, pendingBudgetsTotalPages);
  const pendingBudgetsStartIndex = (currentPendingBudgetsPage - 1) * DASHBOARD_SECONDARY_TABLE_PAGE_SIZE;
  const paginatedPendingBudgets = pendingBudgets.slice(pendingBudgetsStartIndex, pendingBudgetsStartIndex + DASHBOARD_SECONDARY_TABLE_PAGE_SIZE);
  const currentLowStockItemsPage = Math.min(lowStockItemsPage, lowStockItemsTotalPages);
  const lowStockItemsStartIndex = (currentLowStockItemsPage - 1) * DASHBOARD_SECONDARY_TABLE_PAGE_SIZE;
  const paginatedLowStockItems = sortedItems.slice(lowStockItemsStartIndex, lowStockItemsStartIndex + DASHBOARD_SECONDARY_TABLE_PAGE_SIZE);
  const openOrdersCount = serviceOrders.open;
  const inProgressOrdersCount = serviceOrders.inProgress;
  const readyOrdersCount = serviceOrders.readyForDelivery;
  const pendingBudgetsCount = budgets.pending;
  const activeOrderTotal = openOrdersCount + inProgressOrdersCount + readyOrdersCount;
  const projectedBalance = financial.monthRevenue - financial.stockOutValue;
  const averageTicket = financial.averageTicket;
  const periodSubtitle = dashboardPeriodLabels[dashboardPeriod];
  const pendingBudgetTotal = pendingBudgets.reduce((total, budget) => total + budget.total, 0);
  const stockUnitsAtRisk = inventoryData.lowStockItems.reduce((total, item) => total + Math.max(item.minimumQuantity - item.quantity, 0), 0);
  const sparklineFromValue = (value: number) => {
    const base = Math.max(value, 1);
    return [0.62, 0.74, 0.69, 0.83, 0.94, 1].map((factor) => Math.round(base * factor));
  };
  const orderMonthSeries = [0.66, 0.76, 0.8, 0.84, 0.93, 1].map((factor) => Math.max(1, Math.round(activeOrderTotal * factor)));
  const clientGroups = [...activeServiceOrders, ...pendingBudgets].reduce<Record<string, { count: number; total: number }>>((groups, item) => {
    const clientName = 'clientName' in item ? item.clientName : item.client?.name ?? 'Cliente sem nome';
    const total = 'total' in item ? item.total ?? 0 : 0;
    groups[clientName] = {
      count: (groups[clientName]?.count ?? 0) + 1,
      total: (groups[clientName]?.total ?? 0) + total,
    };
    return groups;
  }, {});
  const topClients = Object.entries(clientGroups)
    .map(([label, group]) => ({ label, detail: `${group.count} OS/orçamento(s)`, value: formatCurrency(group.total) }))
    .sort((left, right) => Number(right.value.replace(/\D/g, '')) - Number(left.value.replace(/\D/g, '')))
    .slice(0, 5);
  const mechanicGroups = activeServiceOrders.reduce<Record<string, number>>((groups, order) => {
    const mechanicName = order.mechanicName ?? 'Sem mecânico';
    groups[mechanicName] = (groups[mechanicName] ?? 0) + 1;
    return groups;
  }, {});
  const topMechanics = Object.entries(mechanicGroups)
    .map(([label, count]) => ({ label, detail: `${count} OS em fluxo`, value: `${count} OS` }))
    .sort((left, right) => Number.parseInt(right.value, 10) - Number.parseInt(left.value, 10))
    .slice(0, 5);
  const partGroups = activeServiceOrders.reduce<Record<string, { quantity: number; detail: string }>>((groups, order) => {
    order.parts?.forEach((part) => {
      const name = part.inventoryItem.name;
      groups[name] = {
        quantity: (groups[name]?.quantity ?? 0) + part.quantity,
        detail: part.inventoryItem.internalCode,
      };
    });
    order.budgetItems?.forEach((item) => {
      if (!item.inventoryItem) return;
      groups[item.description] = {
        quantity: (groups[item.description]?.quantity ?? 0) + item.quantity,
        detail: item.inventoryItem.internalCode,
      };
    });
    return groups;
  }, {});
  const bestSellingParts = Object.entries(partGroups)
    .map(([label, group]) => ({ label, detail: group.detail, value: `${group.quantity} un` }))
    .sort((left, right) => Number.parseFloat(right.value) - Number.parseFloat(left.value))
    .slice(0, 5);
  const fallbackParts = inventoryData.lowStockItems
    .slice(0, 5)
    .map((item) => ({ label: item.name, detail: item.internalCode, value: `${item.quantity} un` }));
  const activeMechanicsCount = Object.keys(mechanicGroups).filter((name) => name !== 'Sem mecânico').length;
  const scrollToDashboardTable = (tableId: string, fallbackRoute: string) => {
    const target = document.getElementById(tableId);

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    navigate(fallbackRoute);
  };
  const getAlertAction = (alert: DashboardOperationalAlert) => {
    if (alert.id === 'critical-stock' || alert.id === 'low-stock') {
      return {
        label: 'Ver itens em estoque baixo',
        onClick: () => scrollToDashboardTable('dashboard-low-stock-table', '/inicio/estoque'),
      };
    }

    if (alert.id === 'pending-budgets') {
      return {
        label: 'Ver orçamentos pendentes',
        onClick: () => scrollToDashboardTable('dashboard-pending-budgets-table', '/inicio/orcamentos?status=PENDENTE'),
      };
    }

    if (alert.id === 'overdue-service-orders' || alert.id === 'workshop-flow') {
      return {
        label: 'Ver ordens em execução',
        onClick: () => scrollToDashboardTable('dashboard-active-orders-table', '/inicio/ordens-servico'),
      };
    }

    return alert.actionTo
      ? {
          label: alert.actionLabel ?? 'Ver detalhe',
          onClick: () => navigate(alert.actionTo!),
        }
      : null;
  };
  const dashboardWidgets = [
    {
      id: 'month-revenue',
      title: 'Faturamento',
      category: 'Financeiro',
      className: 'md:col-span-2',
      render: () => (
        <MetricCard
          title="Faturamento"
          value={financial.monthRevenue}
          formatter={formatCurrency}
          delta={12.3}
          subtitle={periodSubtitle}
          tone="orange"
          icon={DollarSign}
          sparkline={sparklineFromValue(financial.monthRevenue)}
        />
      ),
    },
    {
      id: 'stock-out',
      title: 'Despesas',
      category: 'Financeiro',
      className: 'md:col-span-2',
      render: () => (
        <MetricCard
          title="Despesas"
          value={financial.stockOutValue}
          formatter={formatCurrency}
          delta={6.4}
          subtitle={periodSubtitle}
          tone="red"
          icon={TrendingDown}
          sparkline={sparklineFromValue(financial.stockOutValue)}
        />
      ),
    },
    {
      id: 'projected-balance',
      title: 'Lucro líquido',
      category: 'Financeiro',
      className: 'md:col-span-2',
      render: () => (
        <MetricCard
          title="Lucro líquido"
          value={projectedBalance}
          formatter={formatCurrency}
          delta={21.3}
          subtitle={periodSubtitle}
          tone={projectedBalance >= 0 ? 'green' : 'red'}
          icon={TrendingUp}
          sparkline={sparklineFromValue(Math.abs(projectedBalance))}
        />
      ),
    },
    {
      id: 'average-ticket',
      title: 'Ticket médio',
      category: 'Financeiro',
      render: () => <MetricCard title="Ticket médio" value={averageTicket} formatter={formatCurrency} delta={12.4} subtitle={periodSubtitle} tone="orange" icon={Gauge} />,
    },
    {
      id: 'accounts-receivable',
      title: 'Faturamento',
      category: 'Financeiro',
      render: () => <MetricCard title="Faturamento" value={pendingBudgetTotal} formatter={formatCurrency} delta={19.8} tone="green" icon={Receipt} />,
    },
    {
      id: 'accounts-payable',
      title: 'Contas a pagar',
      category: 'Financeiro',
      render: () => <MetricCard title="Contas a pagar" value={financial.stockOutValue} formatter={formatCurrency} delta={10.5} tone="red" icon={TrendingDown} />,
    },
    {
      id: 'os-ready',
      title: 'OS finalizadas',
      category: 'Ordens de Serviço',
      render: () => <MetricCard title="OS finalizadas" value={readyOrdersCount} delta={8.1} tone="orange" icon={ClipboardList} sparkline={sparklineFromValue(readyOrdersCount)} />,
    },
    {
      id: 'os-progress',
      title: 'OS em andamento',
      category: 'Ordens de Serviço',
      render: () => <MetricCard title="OS em andamento" value={inProgressOrdersCount} delta={17.2} tone="orange" icon={Wrench} />,
    },
    {
      id: 'budget-pending',
      title: 'Orçamentos abertos',
      category: 'Ordens de Serviço',
      render: () => <MetricCard title="Orçamentos abertos" value={pendingBudgetsCount} delta={36.8} tone="orange" icon={Receipt} />,
    },
    {
      id: 'execution-time',
      title: 'Tempo médio de execução',
      category: 'Ordens de Serviço',
      render: () => <MetricCard title="Tempo médio de execução" value={Math.max(1, Math.round(activeOrderTotal / 2))} formatter={formatWithSuffix('dias')} delta={-7.4} tone="green" icon={Gauge} />,
    },
    {
      id: 'os-status',
      title: 'OS por status',
      category: 'Ordens de Serviço',
      className: 'md:col-span-2',
      render: () => (
        <StatusDonutCard
          openOrdersCount={openOrdersCount}
          inProgressOrdersCount={inProgressOrdersCount}
          readyOrdersCount={readyOrdersCount}
          pendingBudgetsCount={pendingBudgetsCount}
        />
      ),
    },
    {
      id: 'os-month',
      title: 'OS por mês',
      category: 'Ordens de Serviço',
      className: 'md:col-span-2 lg:col-span-4',
      render: () => <BarMetricCard title="OS por mês" value={activeOrderTotal} values={orderMonthSeries} />,
    },
    {
      id: 'clients-new',
      title: 'Clientes novos',
      category: 'Clientes',
      render: () => <MetricCard title="Clientes novos" value={Object.keys(clientGroups).length} delta={20.8} tone="orange" icon={Users} sparkline={sparklineFromValue(Object.keys(clientGroups).length)} />,
    },
    {
      id: 'clients-total',
      title: 'Total de clientes',
      category: 'Clientes',
      render: () => <MetricCard title="Total de clientes" value={Object.keys(clientGroups).length} delta={3.1} tone="slate" icon={Users} />,
    },
    {
      id: 'return-rate',
      title: 'Taxa de retorno',
      category: 'Clientes',
      render: () => <MetricCard title="Taxa de retorno" value={Math.min(100, Math.round((activeOrderTotal / Math.max(Object.keys(clientGroups).length, 1)) * 18))} formatter={(value) => `${formatInteger(value)}%`} delta={4.3} tone="green" icon={TrendingUp} />,
    },
    {
      id: 'inventory-low',
      title: 'Estoque crítico',
      category: 'Estoque',
      render: () => <MetricCard title="Estoque crítico" value={inventoryData.lowStockCount} formatter={formatWithSuffix('itens')} delta={20} tone="amber" icon={AlertTriangle} />,
    },
    {
      id: 'inventory-out',
      title: 'Saídas de estoque',
      category: 'Estoque',
      render: () => <MetricCard title="Saídas de estoque" value={stockUnitsAtRisk} formatter={formatWithSuffix('un')} delta={16.7} tone="orange" icon={PackageSearch} sparkline={sparklineFromValue(stockUnitsAtRisk)} />,
    },
    {
      id: 'inventory-in',
      title: 'Entradas de estoque',
      category: 'Estoque',
      render: () => <MetricCard title="Entradas de estoque" value={Math.max(stockUnitsAtRisk + inventoryData.lowStockCount, inventoryData.lowStockCount)} formatter={formatWithSuffix('un')} delta={13.8} tone="orange" icon={PackageCheck} sparkline={sparklineFromValue(stockUnitsAtRisk + inventoryData.lowStockCount)} />,
    },
    {
      id: 'mechanics-active',
      title: 'Mecânicos ativos',
      category: 'Equipe',
      render: () => <MetricCard title="Mecânicos ativos" value={activeMechanicsCount} delta={14.3} tone="orange" icon={HardHat} />,
    },
    {
      id: 'top-clients',
      title: 'Top clientes',
      category: 'Clientes',
      className: 'md:col-span-2',
      render: () => <RankingCard title="Top clientes" items={topClients.length ? topClients : [{ label: 'Sem clientes no período', detail: 'Aguardando movimentação', value: '-' }]} />,
    },
    {
      id: 'best-selling-parts',
      title: 'Peças mais vendidas',
      category: 'Estoque',
      className: 'md:col-span-2',
      render: () => <RankingCard title="Peças mais vendidas" items={bestSellingParts.length ? bestSellingParts : fallbackParts} />,
    },
    {
      id: 'top-mechanics',
      title: 'OS por mecânico',
      category: 'Equipe',
      className: 'md:col-span-2',
      render: () => (
        <RankingCard
          title="OS por mecânico"
          items={topMechanics.length ? topMechanics : [{ label: 'Sem mecânico atribuído', detail: 'Aguardando distribuição', value: '-' }]}
        />
      ),
    },
    {
      id: 'active-orders-table',
      title: 'Ordens em execução',
      category: 'Tabela',
      className: 'md:col-span-2 lg:col-span-4',
      render: () => (
        <DashboardTableCard
          id="dashboard-active-orders-table"
          title="Ordens em execução"
          description="Últimas ordens de serviço abertas ou atualizadas"
          actionLabel="Ver todas"
          onAction={() => navigate('/inicio/ordens-servico')}
        >
            {activeServiceOrders.length ? (
              <div className="space-y-4">
                <DashboardTable>
                  <TableHeader>
                    <TableRow>
                      <DashboardTableHead>OS</DashboardTableHead>
                      <DashboardTableHead>Cliente</DashboardTableHead>
                      <DashboardTableHead>Veículo</DashboardTableHead>
                      <DashboardTableHead>Mecânico</DashboardTableHead>
                      <DashboardTableHead>Status</DashboardTableHead>
                      <DashboardTableHead className="text-right">Valor</DashboardTableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedActiveServiceOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-muted/40">
                        <DashboardTableCell><PlateChip>{formatServiceOrderNumber(order.orderNumber)}</PlateChip></DashboardTableCell>
                        <DashboardTableCell>{order.clientName}</DashboardTableCell>
                        <DashboardTableCell>
                          <VehicleIdentityCell
                            plate={order.vehicle?.plate}
                            description={order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model} ${order.vehicle.year}` : null}
                            fallback={order.vehicleLabel}
                          />
                        </DashboardTableCell>
                        <DashboardTableCell>{order.mechanicName ?? '-'}</DashboardTableCell>
                        <DashboardTableCell>
                          <DotStatusPill label={order.status === 'EM_ANDAMENTO' ? 'Em andamento' : order.status === 'ABERTA' ? 'Aberta' : 'Concluída'} tone={serviceOrderStatusTone(order.status)} />
                        </DashboardTableCell>
                        <DashboardTableCell className="text-right font-bold [font-variant-numeric:tabular-nums]">
                          {formatCurrency(order.total ?? 0)}
                        </DashboardTableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DashboardTable>
                <div className="px-5 pb-5">
                  <Pagination
                    page={currentActiveServiceOrdersPage}
                    total={activeServiceOrders.length}
                    pageSize={ACTIVE_SERVICE_ORDERS_PAGE_SIZE}
                    onPageChange={setActiveServiceOrdersPage}
                  />
                </div>
              </div>
            ) : (
              <EmptyState />
            )}
        </DashboardTableCard>
      ),
    },
    {
      id: 'pending-budgets-table',
      title: 'Orçamentos pendentes',
      category: 'Tabela',
      className: 'md:col-span-2 lg:col-span-4',
      render: () => (
        <DashboardTableCard
          id="dashboard-pending-budgets-table"
          title="Orçamentos pendentes"
          description="Orçamentos aguardando aprovação do cliente"
          actionLabel="Ver todos"
          onAction={() => navigate('/inicio/orcamentos?status=PENDENTE')}
        >
            {pendingBudgets.length ? (
              <div className="space-y-4">
                <DashboardTable>
                  <TableHeader>
                    <TableRow>
                      <DashboardTableHead>Código</DashboardTableHead>
                      <DashboardTableHead>Cliente</DashboardTableHead>
                      <DashboardTableHead>Veículo</DashboardTableHead>
                      <DashboardTableHead>Status</DashboardTableHead>
                      <DashboardTableHead>Criado em</DashboardTableHead>
                      <DashboardTableHead className="text-right">Valor</DashboardTableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPendingBudgets.map((budget) => (
                      <TableRow key={budget.id} className="hover:bg-muted/40">
                        <DashboardTableCell><PlateChip>{budget.code}</PlateChip></DashboardTableCell>
                        <DashboardTableCell>{budget.client?.name ?? '-'}</DashboardTableCell>
                        <DashboardTableCell>
                          <VehicleIdentityCell
                            plate={budget.vehicle?.plate}
                            description={budget.vehicle ? `${budget.vehicle.brand} ${budget.vehicle.model} ${budget.vehicle.year}` : null}
                          />
                        </DashboardTableCell>
                        <DashboardTableCell>
                          <DotStatusPill label="Pendente" tone="amber" />
                        </DashboardTableCell>
                        <DashboardTableCell>{formatDateOnly(budget.createdAt)}</DashboardTableCell>
                        <DashboardTableCell className="text-right font-bold [font-variant-numeric:tabular-nums]">{formatCurrency(budget.total)}</DashboardTableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DashboardTable>
                <div className="px-5 pb-5">
                  <Pagination
                    page={currentPendingBudgetsPage}
                    total={pendingBudgets.length}
                    pageSize={DASHBOARD_SECONDARY_TABLE_PAGE_SIZE}
                    onPageChange={setPendingBudgetsPage}
                  />
                </div>
              </div>
            ) : (
              <EmptyState />
            )}
        </DashboardTableCard>
      ),
    },
    {
      id: 'low-stock-table',
      title: 'Itens com estoque baixo',
      category: 'Tabela',
      className: 'md:col-span-2 lg:col-span-4',
      render: () => (
        <DashboardTableCard
          id="dashboard-low-stock-table"
          title="Itens com estoque baixo"
          description="Peças abaixo do estoque mínimo operacional"
          actionLabel="Ver estoque"
          onAction={() => navigate('/inicio/estoque')}
        >
            {sortedItems.length ? (
              <div className="space-y-4">
                <DashboardTable>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead className="h-14 px-6 text-[13px] font-bold tracking-[0.1em] text-muted-foreground" column="internalCode" sortState={sortState} onSort={requestSort}>Código</SortableTableHead>
                      <SortableTableHead className="h-14 px-6 text-[13px] font-bold tracking-[0.1em] text-muted-foreground" column="name" sortState={sortState} onSort={requestSort}>Item</SortableTableHead>
                      <SortableTableHead className="h-14 px-6 text-[13px] font-bold tracking-[0.1em] text-muted-foreground" column="quantity" sortState={sortState} onSort={requestSort}>Atual</SortableTableHead>
                      <SortableTableHead className="h-14 px-6 text-[13px] font-bold tracking-[0.1em] text-muted-foreground" column="minimumQuantity" sortState={sortState} onSort={requestSort}>Mínimo</SortableTableHead>
                      <DashboardTableHead>Status</DashboardTableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLowStockItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/40">
                        <DashboardTableCell><PlateChip>{item.internalCode}</PlateChip></DashboardTableCell>
                        <DashboardTableCell className="font-medium">{item.name}</DashboardTableCell>
                        <DashboardTableCell className="font-bold [font-variant-numeric:tabular-nums]">{item.quantity}</DashboardTableCell>
                        <DashboardTableCell className="text-muted-foreground [font-variant-numeric:tabular-nums]">{item.minimumQuantity}</DashboardTableCell>
                        <DashboardTableCell>
                          <DotStatusPill label={item.quantity <= 0 ? 'Crítico' : 'Baixo'} tone={item.quantity <= 0 ? 'red' : 'amber'} />
                        </DashboardTableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DashboardTable>
                <div className="px-5 pb-5">
                  <Pagination
                    page={currentLowStockItemsPage}
                    total={sortedItems.length}
                    pageSize={DASHBOARD_SECONDARY_TABLE_PAGE_SIZE}
                    onPageChange={setLowStockItemsPage}
                  />
                </div>
              </div>
            ) : (
              <EmptyState />
            )}
        </DashboardTableCard>
      ),
    },
    {
      id: 'operational-alerts',
      title: 'Alertas operacionais',
      category: 'Painel',
      className: 'md:col-span-2 lg:col-span-4',
      render: () => (
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Alertas operacionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {operationalAlerts.length ? (
              operationalAlerts.map((alert) => {
                const alertAction = getAlertAction(alert);

                return (
                  <div key={alert.id} className={`rounded-xl border p-4 ${alertContainerMap[alert.severity]}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 size-4 text-current" />
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{alert.title}</p>
                          <p>{alert.description}</p>
                        </div>
                      </div>
                      <Badge variant={alertVariantMap[alert.severity]}>{alertLabelMap[alert.severity]}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-foreground/80">{alert.metric}</p>
                      {alertAction ? (
                        <Button className="rounded-lg bg-card font-semibold" size="sm" variant="outline" onClick={alertAction.onClick}>
                          {alertAction.label}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="flex items-start gap-3">
                  <BellRing className="mt-0.5 size-4 text-emerald-600" />
                  <div>
                    <p className="font-medium text-foreground">Nenhum alerta crítico agora</p>
                    <p>Fluxo operacional está estável, sem pendências prioritárias no momento.</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="Dashboard" description="Visão operacional da oficina em tempo real.">
        <Button
          className="min-h-11 rounded-xl border-border bg-card px-4 font-semibold shadow-xs"
          type="button"
          variant="outline"
          onClick={() => setIsConfiguringPanel((current) => !current)}
        >
          <Settings2 className="size-4" strokeWidth={1.75} />
          Ajustar painel
        </Button>
        <Button
          className="min-h-11 rounded-xl bg-[linear-gradient(135deg,#F77139_0%,#E04618_100%)] px-5 font-semibold text-white shadow-[0_12px_24px_rgba(224,70,24,0.22)] hover:brightness-105"
          type="button"
          onClick={() => navigate('/inicio/ordens-servico')}
        >
          <Plus className="size-4" strokeWidth={1.75} />
          Nova OS
        </Button>
      </PageHeader>
      <DashboardPeriodFilter value={dashboardPeriod} onChange={setDashboardPeriod} />
      <CustomizableWidgetGrid
        storageKey="oficina:dashboard:widgets:v1"
        widgets={dashboardWidgets}
        gridClassName="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        isConfiguring={isConfiguringPanel}
        onConfiguringChange={setIsConfiguringPanel}
        showHeaderAction={false}
        activeItemsLabel="indicador(es)"
        defaultVisibleIds={[
          'month-revenue',
          'stock-out',
          'projected-balance',
          'average-ticket',
          'accounts-receivable',
          'accounts-payable',
          'os-ready',
          'os-progress',
          'budget-pending',
          'execution-time',
          'os-status',
          'os-month',
          'clients-new',
          'clients-total',
          'return-rate',
          'inventory-low',
          'inventory-out',
          'inventory-in',
          'mechanics-active',
          'top-clients',
          'best-selling-parts',
          'top-mechanics',
          'operational-alerts',
          'active-orders-table',
          'pending-budgets-table',
          'low-stock-table',
        ]}
        emptyMessage="Nenhum item ativo no dashboard."
      />
    </PageContainer>
  );
}
