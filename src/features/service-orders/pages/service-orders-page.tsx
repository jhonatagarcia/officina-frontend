import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, ClipboardList, Clock, Eye, Printer, Settings2, UserCheck, Wrench } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceOrdersService } from '@/features/service-orders/services/service-orders-service';
import { useListParams } from '@/hooks/use-list-params';
import { useSortableData } from '@/hooks/use-sortable-data';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { CustomizableSummaryCards } from '@/components/shared/customizable-widgets';
import { IndicatorHeaderActions } from '@/components/shared/indicator-header-actions';
import { VehicleIdentityCell } from '@/components/shared/table-identity-cells';
import { TableFilterChips } from '@/components/shared/table-filter-chips';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableTableHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DEFAULT_TABLE_PAGE_SIZE } from '@/constants/pagination';
import { getServiceOrderStatusLabel, getServiceOrderStatusTone, isReadOnlyServiceOrderStatus } from '@/features/service-orders/lib/service-order-status';
import { cn, formatCurrency, formatDateOnly, formatServiceOrderNumber } from '@/lib/utils';
import type { ServiceOrder } from '@/features/service-orders/types';

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isOverdueOrder(order: ServiceOrder) {
  if (!order.expectedDeliveryAt || order.status === 'FINALIZADA' || order.status === 'ENTREGUE') return false;

  const expectedDelivery = new Date(order.expectedDeliveryAt);
  return !Number.isNaN(expectedDelivery.getTime()) && expectedDelivery < startOfToday();
}

function getServiceOrderRowClass(order: ServiceOrder) {
  if (isOverdueOrder(order)) return 'border-l-4 border-l-rose-600 hover:bg-stone-50/80';
  return undefined;
}

function getOrderStatusTone(status: ServiceOrder['status']) {
  return getServiceOrderStatusTone(status);
}

function ServiceOrderStatusPill({ status }: { status: ServiceOrder['status'] }) {
  const tone = getOrderStatusTone(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold',
        tone === 'orange' && 'bg-orange-50 text-orange-700',
        tone === 'stone' && 'bg-stone-100 text-stone-700',
        tone === 'amber' && 'bg-amber-50 text-amber-700',
        tone === 'emerald' && 'bg-emerald-50 text-emerald-700',
        tone === 'sky' && 'bg-sky-50 text-sky-700',
      )}
    >
      <span
        className={cn(
          'size-2 rounded-full',
          tone === 'orange' && 'bg-orange-500',
          tone === 'stone' && 'bg-stone-400',
          tone === 'amber' && 'bg-amber-500',
          tone === 'emerald' && 'bg-emerald-500',
          tone === 'sky' && 'bg-sky-500',
        )}
      />
      {getServiceOrderStatusLabel(status)}
    </span>
  );
}

export function ServiceOrdersPage() {
  const navigate = useNavigate();
  const params = useListParams();
  const [isConfiguringPanel, setIsConfiguringPanel] = useState(false);
  const query = useQuery({
    queryKey: ['ordens-servico', params.page, DEFAULT_TABLE_PAGE_SIZE, params.search, params.status],
    queryFn: () =>
      serviceOrdersService.list({
        page: params.page,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        search: params.search,
        status: params.status,
      }),
  });
  const selectedStatus = params.status || 'ALL';
  const filteredOrders =
    query.data?.data.filter((item) => (selectedStatus !== 'ALL' ? item.status === selectedStatus : true)) ?? [];
  const { sortedItems, sortState, requestSort } = useSortableData(filteredOrders, {
    initialSort: { column: 'client', direction: 'asc' },
    accessors: {
      orderNumber: (item) => item.orderNumber,
      client: (item) => item.clientName,
      vehicle: (item) => item.vehicleLabel,
      mechanic: (item) => item.mechanicName,
      status: (item) => item.status,
      expectedDeliveryAt: (item) => (item.expectedDeliveryAt ? new Date(item.expectedDeliveryAt) : null),
      total: (item) => item.total ?? 0,
    },
  });
  const pagination = query.data;
  const openOrdersCount = filteredOrders.filter((item) => item.status === 'ABERTA').length;
  const inProgressOrdersCount = filteredOrders.filter((item) => item.status === 'EM_ANDAMENTO').length;
  const completedOrdersCount = filteredOrders.filter(
    (item) => item.status === 'FINALIZADA' || item.status === 'ENTREGUE',
  ).length;
  const withMechanicCount = filteredOrders.filter((item) => item.mechanicName).length;
  const withDeliveryEstimateCount = filteredOrders.filter((item) => item.expectedDeliveryAt).length;
  const summaryCards = [
    {
      id: 'total',
      title: 'Ordens listadas',
      value: String(query.data?.total ?? 0),
      icon: ClipboardList,
      mediaClassName: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'open',
      title: 'OS abertas',
      value: String(openOrdersCount),
      icon: Clock,
      mediaClassName: 'border-stone-200 bg-stone-100 text-stone-700',
    },
    {
      id: 'in-progress',
      title: 'Em andamento na página',
      value: String(inProgressOrdersCount),
      icon: Wrench,
      mediaClassName: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    {
      id: 'completed',
      title: 'Concluídas na página',
      value: String(completedOrdersCount),
      icon: CheckCircle2,
      mediaClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      id: 'with-mechanic',
      title: 'Com mecânico',
      value: String(withMechanicCount),
      icon: UserCheck,
      mediaClassName: 'border-violet-200 bg-violet-50 text-violet-700',
    },
    {
      id: 'with-delivery-estimate',
      title: 'Com previsão',
      value: String(withDeliveryEstimateCount),
      icon: CalendarDays,
      mediaClassName: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="Ordens de serviço" description="Acompanhamento operacional e status da execução.">
        <IndicatorHeaderActions
          onAdjustPanel={() => setIsConfiguringPanel((current) => !current)}
        >
          <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por OS, cliente ou veículo" />
          <Select value={selectedStatus} onValueChange={(value) => params.setStatus(value === 'ALL' ? '' : value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="ABERTA">Aberta</SelectItem>
              <SelectItem value="AGUARDANDO_PECA">Aguardando peça</SelectItem>
              <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
              <SelectItem value="FINALIZADA">Finalizada</SelectItem>
              <SelectItem value="ENTREGUE">Entregue</SelectItem>
            </SelectContent>
          </Select>
        </IndicatorHeaderActions>
      </PageHeader>
      <CustomizableSummaryCards
        storageKey="oficina:ordens-servico:summary-cards:v1"
        cards={summaryCards}
        defaultVisibleIds={['total', 'open', 'in-progress', 'completed']}
        isConfiguring={isConfiguringPanel}
        onConfiguringChange={setIsConfiguringPanel}
        showHeaderAction={false}
      />
      <Card>
        <CardContent className="p-0">
          {query.isLoading ? <LoadingState /> : null}
          {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
          {!query.isLoading && !query.isError && filteredOrders.length === 0 ? <EmptyState /> : null}
          {query.data ? (
            <TableFilterChips
              value={selectedStatus}
              options={[
                { value: 'ALL', label: 'Todas', count: query.data.data.length, icon: ClipboardList, tone: 'slate' },
                { value: 'ABERTA', label: 'Aberta', count: query.data.data.filter((item) => item.status === 'ABERTA').length, icon: Clock, tone: 'slate' },
                { value: 'AGUARDANDO_PECA', label: 'Aguardando peça', count: query.data.data.filter((item) => item.status === 'AGUARDANDO_PECA').length, icon: Clock, tone: 'amber' },
                { value: 'EM_ANDAMENTO', label: 'Em andamento', count: query.data.data.filter((item) => item.status === 'EM_ANDAMENTO').length, icon: Wrench, tone: 'rose' },
                { value: 'FINALIZADA', label: 'Concluída', count: query.data.data.filter((item) => item.status === 'FINALIZADA').length, icon: CheckCircle2, tone: 'emerald' },
                { value: 'ENTREGUE', label: 'Entregue', count: query.data.data.filter((item) => item.status === 'ENTREGUE').length, icon: ClipboardList, tone: 'sky' },
              ]}
              onChange={(value) => params.setStatus(value === 'ALL' ? '' : value)}
            />
          ) : null}
          {filteredOrders.length ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[1180px]">
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="orderNumber" sortState={sortState} onSort={requestSort}>OS</SortableTableHead>
                    <SortableTableHead column="client" sortState={sortState} onSort={requestSort}>Cliente</SortableTableHead>
                    <SortableTableHead column="vehicle" sortState={sortState} onSort={requestSort}>Veículo</SortableTableHead>
                    <SortableTableHead column="mechanic" sortState={sortState} onSort={requestSort}>Mecânico</SortableTableHead>
                    <SortableTableHead column="status" sortState={sortState} onSort={requestSort}>Status</SortableTableHead>
                    <SortableTableHead column="expectedDeliveryAt" sortState={sortState} onSort={requestSort}>Previsão</SortableTableHead>
                    <SortableTableHead className="text-right" column="total" sortState={sortState} onSort={requestSort}>Valor</SortableTableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => (
                    <TableRow key={item.id} className={getServiceOrderRowClass(item)}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-mono text-sm font-bold text-primary">{formatServiceOrderNumber(item.orderNumber)}</p>
                          <p className="text-xs text-muted-foreground">aberta {formatDateOnly(item.openedAt)}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.clientName}</TableCell>
                      <TableCell>
                        <VehicleIdentityCell
                          plate={item.vehicle?.plate}
                          description={item.vehicle ? `${item.vehicle.brand} ${item.vehicle.model} ${item.vehicle.year}` : null}
                          fallback={item.vehicleLabel}
                        />
                      </TableCell>
                      <TableCell>{item.mechanicName ?? '-'}</TableCell>
                      <TableCell><ServiceOrderStatusPill status={item.status} /></TableCell>
                      <TableCell>
                        {item.expectedDeliveryAt ? (
                          <div className={cn('flex items-center gap-2', isOverdueOrder(item) ? 'font-bold text-rose-700' : 'text-muted-foreground')}>
                            <span>{formatDateOnly(item.expectedDeliveryAt)}</span>
                            {isOverdueOrder(item) ? (
                              <span className="rounded bg-rose-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-rose-700">Atrasada</span>
                            ) : null}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold [font-variant-numeric:tabular-nums]">
                        {formatCurrency(item.total ?? 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            aria-label={`Visualizar ${formatServiceOrderNumber(item.orderNumber)}`}
                            className="size-9 rounded-lg bg-white"
                            size="icon"
                            title="Visualizar OS"
                            variant="outline"
                            onClick={() => navigate(`/app/ordens-servico/${item.id}?mode=view`)}
                          >
                            <Eye className="size-4" strokeWidth={1.75} />
                          </Button>
                          {!isReadOnlyServiceOrderStatus(item.status) ? (
                            <Button
                              aria-label={`Operar ${formatServiceOrderNumber(item.orderNumber)}`}
                              className="size-9 rounded-lg bg-white"
                              size="icon"
                              title="Operar OS"
                              variant="outline"
                              onClick={() => navigate(`/app/ordens-servico/${item.id}?mode=operate`)}
                            >
                              <Settings2 className="size-4" strokeWidth={1.75} />
                            </Button>
                          ) : null}
                          <Button
                            aria-label={`Imprimir ${formatServiceOrderNumber(item.orderNumber)}`}
                            className="size-9 rounded-lg bg-white"
                            size="icon"
                            title="Imprimir OS"
                            variant="outline"
                            onClick={() => navigate(`/app/ordens-servico/${item.id}?mode=print`)}
                          >
                            <Printer className="size-4" strokeWidth={1.75} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-5">
                {pagination ? (
                  <Pagination page={pagination.page} total={pagination.total} pageSize={pagination.pageSize} onPageChange={params.setPage} />
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
