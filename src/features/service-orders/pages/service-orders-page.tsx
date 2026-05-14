import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, ClipboardList, Clock, Eye, UserCheck, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { serviceOrdersService } from '@/features/service-orders/services/service-orders-service';
import { useListParams } from '@/hooks/use-list-params';
import { useSortableData } from '@/hooks/use-sortable-data';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { CustomizableSummaryCards } from '@/components/shared/customizable-widgets';
import { StatusBadge } from '@/components/shared/status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableTableHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DEFAULT_TABLE_PAGE_SIZE } from '@/constants/pagination';
import { cn, formatDateOnly, formatServiceOrderNumber } from '@/lib/utils';
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
  if (isOverdueOrder(order)) return 'bg-rose-50/45 hover:bg-rose-50/70';
  if (order.status === 'ABERTA') return 'bg-amber-50/25 hover:bg-amber-50/50';
  return undefined;
}

export function ServiceOrdersPage() {
  const navigate = useNavigate();
  const params = useListParams();
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
      mediaClassName: 'border-amber-200 bg-amber-50 text-amber-700',
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
        <div className="flex gap-3">
          <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por OS, cliente ou veículo" />
          <Select value={selectedStatus} onValueChange={(value) => params.setStatus(value === 'ALL' ? '' : value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="ABERTA">Aberta</SelectItem>
              <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
              <SelectItem value="FINALIZADA">Finalizada</SelectItem>
              <SelectItem value="ENTREGUE">Entregue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>
      <CustomizableSummaryCards
        storageKey="oficina:ordens-servico:summary-cards:v1"
        cards={summaryCards}
        defaultVisibleIds={['total', 'open', 'in-progress', 'completed']}
      />
      <Card>
        <CardContent className="p-0">
          {query.isLoading ? <LoadingState /> : null}
          {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
          {!query.isLoading && !query.isError && filteredOrders.length === 0 ? <EmptyState /> : null}
          {filteredOrders.length ? (
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="orderNumber" sortState={sortState} onSort={requestSort}>OS</SortableTableHead>
                    <SortableTableHead column="client" sortState={sortState} onSort={requestSort}>Cliente</SortableTableHead>
                    <SortableTableHead column="vehicle" sortState={sortState} onSort={requestSort}>Veículo</SortableTableHead>
                    <SortableTableHead column="mechanic" sortState={sortState} onSort={requestSort}>Mecânico</SortableTableHead>
                    <SortableTableHead column="status" sortState={sortState} onSort={requestSort}>Status</SortableTableHead>
                    <SortableTableHead column="expectedDeliveryAt" sortState={sortState} onSort={requestSort}>Previsão</SortableTableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => (
                    <TableRow key={item.id} className={getServiceOrderRowClass(item)}>
                      <TableCell className="font-medium">{formatServiceOrderNumber(item.orderNumber)}</TableCell>
                      <TableCell>{item.clientName}</TableCell>
                      <TableCell>{item.vehicleLabel}</TableCell>
                      <TableCell>{item.mechanicName ?? '-'}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell className={cn(isOverdueOrder(item) ? 'font-medium text-rose-700' : null)}>
                        {item.expectedDeliveryAt ? formatDateOnly(item.expectedDeliveryAt) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="outline" onClick={() => navigate(`/app/ordens-servico/${item.id}`)}>
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-6">
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
