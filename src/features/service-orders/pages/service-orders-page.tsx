import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { serviceOrdersService } from '@/features/service-orders/services/service-orders-service';
import { useListParams } from '@/hooks/use-list-params';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function ServiceOrdersPage() {
  const navigate = useNavigate();
  const params = useListParams();
  const query = useQuery({
    queryKey: ['ordens-servico', params.page, params.search, params.status],
    queryFn: () =>
      serviceOrdersService.list({
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
      }),
  });
  const selectedStatus = params.status || 'ALL';
  const filteredOrders =
    query.data?.data.filter((item) => (selectedStatus !== 'ALL' ? item.status === selectedStatus : true)) ?? [];
  const pagination = query.data;

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
                    <TableHead>Cliente</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Mecânico</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.clientName}</TableCell>
                      <TableCell>{item.vehicleLabel}</TableCell>
                      <TableCell>{item.mechanicName ?? '-'}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
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
