import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DollarSign, PackageSearch, TrendingUp } from 'lucide-react';
import { financialService } from '@/features/financial/services/financial-service';
import type { FinancialEntry, PaymentMethod } from '@/features/financial/types';
import { useListParams } from '@/hooks/use-list-params';
import { useSortableData } from '@/hooks/use-sortable-data';
import { formatCurrency, formatDate, formatServiceOrderNumber } from '@/lib/utils';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { SummaryCard } from '@/components/shared/summary-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableTableHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function canRegisterPayment(status: string) {
  return status === 'PENDENTE' || status === 'VENCIDO';
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
  const params = useListParams();
  const queryClient = useQueryClient();
  const [paymentDates, setPaymentDates] = useState<Record<string, string>>({});
  const today = toDateInputValue(new Date());
  const query = useQuery({
    queryKey: ['financeiro', params.page, params.search, params.status],
    queryFn: () =>
      financialService.list({
        page: params.page,
        pageSize: params.pageSize,
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
  const selectedStatus = params.status || 'ALL';
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

  return (
    <PageContainer>
      <PageHeader title="Financeiro" description="Contas a receber, saída de estoque e conciliação.">
        <div className="flex gap-3">
          <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por descrição ou origem" />
          <Select value={selectedStatus} onValueChange={(value) => params.setStatus(value === 'ALL' ? '' : value)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="VENCIDO">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Saldo projetado" value={formatCurrency(income - stockOutValue)} icon={DollarSign} valueClassName="text-sky-600" />
        <SummaryCard title="Contas a receber" value={formatCurrency(income)} icon={TrendingUp} valueClassName="text-emerald-600" />
        <SummaryCard title="Saída de estoque" value={formatCurrency(stockOutValue)} icon={PackageSearch} valueClassName="text-rose-600" />
      </div>
      <Card>
        <CardContent className="p-0">
          {query.isLoading ? <LoadingState /> : null}
          {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
          {!query.isLoading && !query.isError && filteredEntries.length === 0 ? <EmptyState /> : null}
          {filteredEntries.length ? (
            <div className="p-6">
              <Table>
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
                    <TableRow key={entry.id}>
                      <TableCell>
                        {entry.serviceOrder ? formatServiceOrderNumber(entry.serviceOrder.orderNumber) : entry.description}
                      </TableCell>
                      <TableCell><StatusBadge status={entry.status} /></TableCell>
                      <TableCell>{formatCurrency(entry.amount)}</TableCell>
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
