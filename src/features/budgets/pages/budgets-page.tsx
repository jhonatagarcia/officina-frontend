import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, DollarSign, Eye, FileText, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { budgetsService } from '@/features/budgets/services/budgets-service';
import { useListParams } from '@/hooks/use-list-params';
import { useSortableData } from '@/hooks/use-sortable-data';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
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
import { formatCurrency } from '@/lib/utils';

export function BudgetsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useListParams();
  const query = useQuery({
    queryKey: ['orcamentos', params.page, DEFAULT_TABLE_PAGE_SIZE, params.search, params.status],
    queryFn: () =>
      budgetsService.list({
        page: params.page,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        search: params.search,
        status: params.status,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: budgetsService.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
  const convertMutation = useMutation({
    mutationFn: budgetsService.convert,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Orçamento convertido em ordem de serviço.');

      const serviceOrderId = result?.serviceOrder?.id;
      if (serviceOrderId) {
        navigate(`/app/ordens-servico/${serviceOrderId}`);
      }
    },
  });
  const selectedStatus = params.status || 'ALL';
  const filteredBudgets = query.data?.data ?? [];
  const { sortedItems, sortState, requestSort } = useSortableData(filteredBudgets, {
    initialSort: { column: 'client', direction: 'asc' },
    accessors: {
      client: (budget) => budget.client?.name,
      vehicle: (budget) => (budget.vehicle ? `${budget.vehicle.plate} ${budget.vehicle.brand} ${budget.vehicle.model}` : ''),
      status: (budget) => budget.status,
      total: (budget) => budget.total,
    },
  });
  const pagination = query.data;
  const pendingBudgetsCount = filteredBudgets.filter((budget) => budget.status === 'PENDENTE').length;
  const approvedBudgetsCount = filteredBudgets.filter((budget) => budget.status === 'APROVADO').length;
  const rejectedBudgetsCount = filteredBudgets.filter((budget) => budget.status === 'REPROVADO').length;
  const convertedBudgetsCount = filteredBudgets.filter((budget) => budget.convertedToServiceOrder).length;
  const pageTotal = filteredBudgets.reduce((total, budget) => total + budget.total, 0);
  const summaryCards = [
    {
      id: 'total',
      title: 'Orçamentos listados',
      value: String(query.data?.total ?? 0),
      icon: FileText,
      mediaClassName: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'pending',
      title: 'Pendentes na página',
      value: String(pendingBudgetsCount),
      icon: Clock,
      mediaClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    {
      id: 'approved',
      title: 'Aprovados na página',
      value: String(approvedBudgetsCount),
      icon: CheckCircle2,
      mediaClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      id: 'rejected',
      title: 'Reprovados na página',
      value: String(rejectedBudgetsCount),
      icon: XCircle,
      mediaClassName: 'border-rose-200 bg-rose-50 text-rose-700',
    },
    {
      id: 'converted',
      title: 'Convertidos na página',
      value: String(convertedBudgetsCount),
      icon: CheckCircle2,
      mediaClassName: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    {
      id: 'page-total',
      title: 'Total da página',
      value: formatCurrency(pageTotal),
      icon: DollarSign,
      valueClassName: 'text-emerald-600',
      mediaClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
  ];
  const rejectMutation = useMutation({
    mutationFn: budgetsService.reject,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['orcamentos'],
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });


  return (
    <PageContainer>
      <PageHeader title="Orçamentos" description="Criação, aprovação e conversão em OS.">
        <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
          <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por cliente, veículo ou problema" />
          <Select value={selectedStatus} onValueChange={(value) => params.setStatus(value === 'ALL' ? '' : value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="APROVADO">Aprovado</SelectItem>
              <SelectItem value="REPROVADO">Reprovado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="shrink-0" onClick={() => navigate('/app/orcamentos/novo')}>Novo orçamento</Button>
      </PageHeader>
      <CustomizableSummaryCards
        storageKey="oficina:orcamentos:summary-cards:v1"
        cards={summaryCards}
        defaultVisibleIds={['total', 'pending', 'approved', 'rejected']}
      />
      <Card>
        <CardContent className="p-0">
          {query.isLoading ? <LoadingState /> : null}
          {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
          {!query.isLoading && !query.isError && filteredBudgets.length === 0 ? <EmptyState /> : null}
          {filteredBudgets.length ? (
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="client" sortState={sortState} onSort={requestSort}>Cliente</SortableTableHead>
                    <SortableTableHead column="vehicle" sortState={sortState} onSort={requestSort}>Veículo</SortableTableHead>
                    <SortableTableHead column="status" sortState={sortState} onSort={requestSort}>Status</SortableTableHead>
                    <SortableTableHead column="total" sortState={sortState} onSort={requestSort}>Total</SortableTableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((budget) => (
                    <TableRow key={budget.id}>
                      <TableCell>{budget.client?.name ?? '-'}</TableCell>
                      <TableCell>{budget.vehicle ? `${budget.vehicle.plate} • ${budget.vehicle.brand} ${budget.vehicle.model}` : '-'}</TableCell>
                      <TableCell><StatusBadge status={budget.status} /></TableCell>
                      <TableCell>{formatCurrency(budget.total)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="outline" onClick={() => navigate(`/app/orcamentos/${budget.id}`)}>
                            <Eye className="size-4" />
                          </Button>
                          {budget.status === 'PENDENTE' && !budget.convertedToServiceOrder ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate(budget.id)}>
                                Reprovar
                              </Button>
                              <Button size="sm" onClick={() => approveMutation.mutate(budget.id)}>
                                Aprovar
                              </Button>
                            </>
                          ) : null}
                          {budget.status === 'APROVADO' && !budget.convertedToServiceOrder ? (
                            <Button size="sm" onClick={() => convertMutation.mutate(budget.id)} disabled={convertMutation.isPending}>
                              {convertMutation.isPending ? 'Convertendo...' : 'Converter em OS'}
                            </Button>
                          ) : null}
                        </div>
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
