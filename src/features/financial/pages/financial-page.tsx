import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { financialService } from '@/features/financial/services/financial-service';
import type { PaymentMethod } from '@/features/financial/types';
import { useListParams } from '@/hooks/use-list-params';
import { formatCurrency } from '@/lib/utils';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function canRegisterPayment(status: string) {
  return status === 'PENDENTE' || status === 'VENCIDO';
}

export function FinancialPage() {
  const params = useListParams();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['financeiro', params.page, params.search, params.status, params.type],
    queryFn: () =>
      financialService.list({
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
      }),
  });
  const mutation = useMutation({
    mutationFn: ({ id, paymentMethod }: { id: string; paymentMethod: PaymentMethod }) =>
      financialService.markAsPaid(id, { paymentMethod, paidAt: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financeiro'] }),
  });
  const selectedType = params.type || 'ALL';
  const selectedStatus = params.status || 'ALL';
  const filteredEntries =
    query.data?.data.filter((item) => {
      const matchesType = selectedType !== 'ALL' ? item.type === selectedType : true;
      const matchesStatus = selectedStatus !== 'ALL' ? item.status === selectedStatus : true;
      return matchesType && matchesStatus;
    }) ?? [];
  const pagination = query.data;
  const income = filteredEntries.filter((item) => item.type === 'RECEIVABLE').reduce((acc, item) => acc + item.amount, 0) ?? 0;
  const expense = filteredEntries.filter((item) => item.type === 'PAYABLE').reduce((acc, item) => acc + item.amount, 0) ?? 0;

  return (
    <PageContainer>
      <PageHeader title="Financeiro" description="Contas a pagar, contas a receber e conciliação.">
        <div className="flex gap-3">
          <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por descrição ou origem" />
          <Select value={selectedType} onValueChange={(value) => params.setType(value === 'ALL' ? '' : value)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="RECEIVABLE">Receber</SelectItem>
              <SelectItem value="PAYABLE">Pagar</SelectItem>
            </SelectContent>
          </Select>
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
        <SummaryCard title="Saldo projetado" value={formatCurrency(income - expense)} icon={DollarSign} />
        <SummaryCard title="Contas a receber" value={formatCurrency(income)} icon={TrendingUp} />
        <SummaryCard title="Contas a pagar" value={formatCurrency(expense)} icon={TrendingDown} />
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
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>{entry.type === 'RECEIVABLE' ? 'Receber' : 'Pagar'}</TableCell>
                      <TableCell><StatusBadge status={entry.status} /></TableCell>
                      <TableCell>{formatCurrency(entry.amount)}</TableCell>
                      <TableCell>{entry.serviceOrder ? `OS ${entry.serviceOrder.orderNumber}` : entry.client?.name ?? '-'}</TableCell>
                      <TableCell className="text-right">
                        {canRegisterPayment(entry.status) ? (
                          <Button
                            size="sm"
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate({ id: entry.id, paymentMethod: 'PIX' })}
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
