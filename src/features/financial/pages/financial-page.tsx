import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, DollarSign, PackageSearch, TrendingUp } from 'lucide-react';
import { financialService } from '@/features/financial/services/financial-service';
import type { FinancialEntry, PaymentMethod } from '@/features/financial/types';
import { useListParams } from '@/hooks/use-list-params';
import { useSortableData } from '@/hooks/use-sortable-data';
import { cn, formatCurrency, formatDate, formatServiceOrderNumber } from '@/lib/utils';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { CustomizableSummaryCards } from '@/components/shared/customizable-widgets';
import { IndicatorHeaderActions } from '@/components/shared/indicator-header-actions';
import { PlateChip } from '@/components/shared/table-identity-cells';
import { TableFilterChips } from '@/components/shared/table-filter-chips';
import { StatusBadge } from '@/components/shared/status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SortableTableHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DEFAULT_TABLE_PAGE_SIZE } from '@/constants/pagination';

function canRegisterPayment(status: string) {
  return status === 'VENCIDO';
}

function getFinancialRowClass(status: string) {
  if (status === 'VENCIDO') return 'bg-rose-50/45 hover:bg-rose-50/70';
  return undefined;
}

function getEntryOriginLabel(entry: FinancialEntry) {
  if (entry.serviceOrder) return 'Ordem de serviço';
  return entry.client?.name ?? '-';
}

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toPaidAtIsoString(value: string) {
  return new Date(`${value}T12:00:00`).toISOString();
}

export function FinancialPage() {
  return <FinancialPageContent />;
}

function FinancialPageContent() {
  const params = useListParams();
  const queryClient = useQueryClient();
  const [isConfiguringPanel, setIsConfiguringPanel] = useState(false);
  const [paymentDates, setPaymentDates] = useState<Record<string, string>>({});
  const today = toDateInputValue(new Date());
  const query = useQuery({
    queryKey: ['financeiro', params.page, DEFAULT_TABLE_PAGE_SIZE, params.search, params.status],
    queryFn: () =>
      financialService.list({
        page: params.page,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        search: params.search,
      }),
  });
  const summaryQuery = useQuery({
    queryKey: ['financeiro', 'summary'],
    queryFn: financialService.getSummary,
  });
  const mutation = useMutation({
    mutationFn: ({ id, paymentMethod, paidAt }: { id: string; paymentMethod: PaymentMethod; paidAt: string }) =>
      financialService.markAsPaid(id, { paymentMethod, paidAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
  const selectedStatus = params.status === 'PAGO' || params.status === 'VENCIDO' ? params.status : 'ALL';
  const filteredEntries =
    query.data?.data.filter((item) => {
      const matchesStatus = selectedStatus !== 'ALL' ? item.status === selectedStatus : true;
      return matchesStatus;
    }) ?? [];
  const { sortedItems, sortState, requestSort } = useSortableData(filteredEntries, {
    initialSort: { column: 'description', direction: 'asc' },
    accessors: {
      description: (entry) => (entry.serviceOrder ? entry.serviceOrder.orderNumber : entry.description),
      status: (entry) => entry.status,
      amount: (entry) => entry.amount,
      paidAt: (entry) => (entry.paidAt ? new Date(entry.paidAt) : null),
      client: (entry) => entry.client?.name,
      origin: (entry) => getEntryOriginLabel(entry),
    },
  });
  const pagination = query.data;
  const income = summaryQuery.data?.receivablesValue ?? filteredEntries.filter((item) => item.type === 'RECEIVABLE').reduce((acc, item) => acc + item.amount, 0) ?? 0;
  const stockOutValue = summaryQuery.data?.stockOutValue ?? 0;
  const projectedBalance = income - stockOutValue;
  const paidEntriesCount = filteredEntries.filter((item) => item.status === 'PAGO').length;
  const overdueEntriesCount = filteredEntries.filter((item) => item.status === 'VENCIDO').length;
  const pageTotal = filteredEntries.reduce((total, item) => total + item.amount, 0);
  const summaryCards = [
    {
      id: 'projected-balance',
      title: 'Saldo projetado',
      value: formatCurrency(projectedBalance),
      icon: DollarSign,
      valueClassName: projectedBalance < 0 ? 'text-rose-600' : 'text-sky-600',
      mediaClassName: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    {
      id: 'receivables',
      title: 'Faturamento',
      value: formatCurrency(income),
      icon: TrendingUp,
      valueClassName: 'text-emerald-600',
      mediaClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      id: 'stock-out',
      title: 'Saída de estoque',
      value: formatCurrency(stockOutValue),
      icon: PackageSearch,
      valueClassName: 'text-rose-600',
      mediaClassName: 'border-rose-200 bg-rose-50 text-rose-700',
    },
    {
      id: 'paid',
      title: 'Pagos na página',
      value: String(paidEntriesCount),
      icon: CheckCircle2,
      mediaClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      id: 'overdue',
      title: 'Vencidos na página',
      value: String(overdueEntriesCount),
      icon: AlertTriangle,
      mediaClassName: 'border-rose-200 bg-rose-50 text-rose-700',
    },
    {
      id: 'page-total',
      title: 'Total da página',
      value: formatCurrency(pageTotal),
      icon: DollarSign,
      mediaClassName: 'border-violet-200 bg-violet-50 text-violet-700',
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="Financeiro" description="Faturamento, saída de estoque e conciliação.">
        <IndicatorHeaderActions onAdjustPanel={() => setIsConfiguringPanel((current) => !current)}>
          <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por descrição ou origem" />
        </IndicatorHeaderActions>
      </PageHeader>
      <CustomizableSummaryCards
        storageKey="oficina:financeiro:summary-cards:v1"
        cards={summaryCards}
        defaultVisibleIds={['projected-balance', 'receivables', 'stock-out']}
        gridClassName="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        isConfiguring={isConfiguringPanel}
        onConfiguringChange={setIsConfiguringPanel}
        showHeaderAction={false}
      />
      <Card>
        <CardContent className="p-0">
          {query.isLoading ? <LoadingState /> : null}
          {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
          {!query.isLoading && !query.isError && filteredEntries.length === 0 ? <EmptyState /> : null}
          {query.data ? (
            <TableFilterChips
              value={selectedStatus}
              options={[
                { value: 'ALL', label: 'Todos', count: query.data.data.length, icon: DollarSign, tone: 'slate' },
                { value: 'PAGO', label: 'Pago', count: paidEntriesCount, icon: CheckCircle2, tone: 'emerald' },
                { value: 'VENCIDO', label: 'Vencido', count: overdueEntriesCount, icon: AlertTriangle, tone: 'rose' },
              ]}
              onChange={(value) => params.setStatus(value === 'ALL' ? '' : value)}
            />
          ) : null}
          {filteredEntries.length ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="description" sortState={sortState} onSort={requestSort}>Descrição</SortableTableHead>
                    <SortableTableHead column="status" sortState={sortState} onSort={requestSort}>Status</SortableTableHead>
                    <SortableTableHead column="amount" sortState={sortState} onSort={requestSort}>Valor</SortableTableHead>
                    <SortableTableHead column="paidAt" sortState={sortState} onSort={requestSort}>Data do pagamento</SortableTableHead>
                    <SortableTableHead column="client" sortState={sortState} onSort={requestSort}>Cliente</SortableTableHead>
                    <SortableTableHead column="origin" sortState={sortState} onSort={requestSort}>Origem</SortableTableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((entry) => (
                    <TableRow key={entry.id} className={getFinancialRowClass(entry.status)}>
                      <TableCell>
                        {entry.serviceOrder ? <PlateChip>{formatServiceOrderNumber(entry.serviceOrder.orderNumber)}</PlateChip> : entry.description}
                      </TableCell>
                      <TableCell><StatusBadge status={entry.status} /></TableCell>
                      <TableCell className={cn('font-bold [font-variant-numeric:tabular-nums]', entry.status === 'VENCIDO' ? 'text-red-500' : null)}>
                        {formatCurrency(entry.amount)}
                      </TableCell>
                      <TableCell>
                        {entry.paidAt ? (
                          formatDate(entry.paidAt)
                        ) : canRegisterPayment(entry.status) ? (
                          <Input
                            className="w-[170px]"
                            type="date"
                            value={paymentDates[entry.id] ?? today}
                            onChange={(event) =>
                              setPaymentDates((current) => ({
                                ...current,
                                [entry.id]: event.target.value,
                              }))
                            }
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{entry.client?.name ?? '-'}</TableCell>
                      <TableCell>{getEntryOriginLabel(entry)}</TableCell>
                      <TableCell className="text-right">
                        {canRegisterPayment(entry.status) ? (
                          <Button
                            size="sm"
                            disabled={mutation.isPending}
                            onClick={() =>
                              mutation.mutate({
                                id: entry.id,
                                paymentMethod: 'PIX',
                                paidAt: toPaidAtIsoString(paymentDates[entry.id] ?? today),
                              })
                            }
                          >
                            Registrar pagamento
                          </Button>
                        ) : null}
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
