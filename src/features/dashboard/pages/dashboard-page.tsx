import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BellRing, Car, ClipboardList, DollarSign, PackageSearch, Receipt, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '@/features/dashboard/services/dashboard-service';
import { useSortableData } from '@/hooks/use-sortable-data';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { SummaryCard } from '@/components/shared/summary-card';
import { Pagination } from '@/components/shared/pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SortableTableHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDateOnly, formatServiceOrderNumber } from '@/lib/utils';
import type { DashboardOperationalAlert } from '@/features/dashboard/types';

const ACTIVE_SERVICE_ORDERS_PAGE_SIZE = 3;

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
  danger: 'border-rose-200 bg-rose-50/70',
  warning: 'border-amber-200 bg-amber-50/70',
  info: 'border-sky-200 bg-sky-50/70',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [activeServiceOrdersPage, setActiveServiceOrdersPage] = useState(1);
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getOverview,
  });
  const activeServiceOrdersTotalPages = Math.max(1, Math.ceil((query.data?.activeServiceOrders.length ?? 0) / ACTIVE_SERVICE_ORDERS_PAGE_SIZE));
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

  useEffect(() => {
    setActiveServiceOrdersPage((page) => Math.min(page, activeServiceOrdersTotalPages));
  }, [activeServiceOrdersTotalPages]);

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  const { serviceOrders, budgets, financial, inventory: inventoryData, activeServiceOrders, pendingBudgets, operationalAlerts } = query.data;
  const currentActiveServiceOrdersPage = Math.min(activeServiceOrdersPage, activeServiceOrdersTotalPages);
  const activeServiceOrdersStartIndex = (currentActiveServiceOrdersPage - 1) * ACTIVE_SERVICE_ORDERS_PAGE_SIZE;
  const paginatedActiveServiceOrders = activeServiceOrders.slice(activeServiceOrdersStartIndex, activeServiceOrdersStartIndex + ACTIVE_SERVICE_ORDERS_PAGE_SIZE);

  return (
    <PageContainer>
      <PageHeader title="Dashboard" description="Visão operacional da oficina em tempo real." />

      <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <SummaryCard title="OS abertas" value={String(serviceOrders.open)} icon={ClipboardList} size="compact" />
          <SummaryCard title="Veículos em andamento" value={String(serviceOrders.inProgress)} icon={Wrench} size="compact" />
          <SummaryCard title="Prontos para entrega" value={String(serviceOrders.readyForDelivery)} icon={Car} size="compact" />
          <SummaryCard title="Orçamentos pendentes" value={String(budgets.pending)} icon={Receipt} size="compact" />
          <SummaryCard title="Estoque baixo" value={String(inventoryData.lowStockCount)} icon={PackageSearch} size="compact" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SummaryCard title="Faturamento do mês" value={formatCurrency(financial.monthRevenue)} icon={DollarSign} valueClassName="text-emerald-600" />
          <SummaryCard title="Saída de estoque" value={formatCurrency(financial.stockOutValue)} icon={PackageSearch} valueClassName="text-rose-600" />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Ordens em execução</CardTitle>
            <Button size="sm" variant="outline" onClick={() => navigate('/app/ordens-servico')}>
              Ver todas
            </Button>
          </CardHeader>
          <CardContent>
            {activeServiceOrders.length ? (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>OS</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Previsão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedActiveServiceOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{formatServiceOrderNumber(order.orderNumber)}</TableCell>
                        <TableCell>{order.clientName}</TableCell>
                        <TableCell>{order.vehicleLabel}</TableCell>
                        <TableCell><StatusBadge status={order.status} /></TableCell>
                        <TableCell>{order.expectedDeliveryAt ? formatDateOnly(order.expectedDeliveryAt) : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pagination
                  page={currentActiveServiceOrdersPage}
                  total={activeServiceOrders.length}
                  pageSize={ACTIVE_SERVICE_ORDERS_PAGE_SIZE}
                  onPageChange={setActiveServiceOrdersPage}
                />
              </div>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Orçamentos pendentes</CardTitle>
            <Button size="sm" variant="outline" onClick={() => navigate('/app/orcamentos?status=PENDENTE')}>
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            {pendingBudgets.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingBudgets.map((budget) => (
                    <TableRow key={budget.id}>
                      <TableCell>{budget.client?.name ?? '-'}</TableCell>
                      <TableCell>{budget.vehicle ? `${budget.vehicle.plate} • ${budget.vehicle.brand} ${budget.vehicle.model}` : '-'}</TableCell>
                      <TableCell>{formatCurrency(budget.total)}</TableCell>
                      <TableCell>{formatDateOnly(budget.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Itens com estoque baixo</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedItems.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="internalCode" sortState={sortState} onSort={requestSort}>Código</SortableTableHead>
                    <SortableTableHead column="name" sortState={sortState} onSort={requestSort}>Item</SortableTableHead>
                    <SortableTableHead column="quantity" sortState={sortState} onSort={requestSort}>Atual</SortableTableHead>
                    <SortableTableHead column="minimumQuantity" sortState={sortState} onSort={requestSort}>Mínimo</SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.internalCode}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.minimumQuantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas operacionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {operationalAlerts.length ? (
              operationalAlerts.map((alert) => (
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
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-foreground/80">{alert.metric}</p>
                  {alert.actionTo ? (
                    <div className="mt-3">
                      <Button size="sm" variant="outline" onClick={() => navigate(alert.actionTo!)}>
                        {alert.actionLabel ?? 'Ver detalhe'}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
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
      </div>
    </PageContainer>
  );
}
