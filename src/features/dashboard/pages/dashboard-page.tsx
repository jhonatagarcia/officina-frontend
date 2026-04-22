import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BellRing, Car, ClipboardList, DollarSign, PackageSearch, Receipt, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '@/features/dashboard/services/dashboard-service';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { SummaryCard } from '@/components/shared/summary-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { DashboardOperationalAlert } from '@/features/dashboard/types';

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
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getOverview,
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  const { serviceOrders, budgets, financial, inventory, operationalAlerts } = query.data;

  return (
    <PageContainer>
      <PageHeader title="Dashboard" description="Visão operacional da oficina em tempo real." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard title="OS abertas" value={String(serviceOrders.open)} icon={ClipboardList} />
        <SummaryCard title="Veículos em andamento" value={String(serviceOrders.inProgress)} icon={Wrench} />
        <SummaryCard title="Prontos para entrega" value={String(serviceOrders.readyForDelivery)} icon={Car} />
        <SummaryCard title="Orçamentos pendentes" value={String(budgets.pending)} icon={Receipt} />
        <SummaryCard title="Faturamento do mês" value={formatCurrency(financial.monthRevenue)} icon={DollarSign} />
        <SummaryCard title="Estoque baixo" value={String(inventory.lowStockCount)} icon={PackageSearch} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Itens com estoque baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Atual</TableHead>
                  <TableHead>Mínimo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.lowStockItems.length ? (
                  inventory.lowStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.internalCode}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.minimumQuantity}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="py-8 text-center text-muted-foreground" colSpan={4}>
                      Nenhum item com estoque crítico no momento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
