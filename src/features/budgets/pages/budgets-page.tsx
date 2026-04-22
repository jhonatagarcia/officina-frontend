import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { budgetsService } from '@/features/budgets/services/budgets-service';
import { useListParams } from '@/hooks/use-list-params';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { StatusBadge } from '@/components/shared/status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

export function BudgetsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useListParams();
  const query = useQuery({
    queryKey: ['orcamentos', params.page, params.search, params.status],
    queryFn: () =>
      budgetsService.list({
        page: params.page,
        pageSize: params.pageSize,
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

      const serviceOrderId = result?.id ?? result?.serviceOrder?.id;
      if (serviceOrderId) {
        navigate(`/app/ordens-servico/${serviceOrderId}`);
      }
    },
  });
  const selectedStatus = params.status || 'ALL';
  const filteredBudgets = query.data?.data ?? [];
  const pagination = query.data;
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
      <PageHeader title="Orçamentos" description="Criação, aprovação e conversão em OS." actionLabel="Novo orçamento" onAction={() => navigate('/app/orcamentos/novo')}>
        <div className="flex gap-3">
          <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por cliente, veículo ou problema" />
          <Select value={selectedStatus} onValueChange={(value) => params.setStatus(value === 'ALL' ? '' : value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="APROVADO">Aprovado</SelectItem>
              <SelectItem value="REPROVADO">Reprovado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>
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
                    <TableHead>Cliente</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBudgets.map((budget) => (
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
