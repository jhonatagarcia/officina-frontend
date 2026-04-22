import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '@/features/inventory/services/inventory-service';
import { useListParams } from '@/hooks/use-list-params';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { SummaryCard } from '@/components/shared/summary-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Boxes } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function InventoryPage() {
  const navigate = useNavigate();
  const params = useListParams();
  const query = useQuery({
    queryKey: ['estoque', params.page, params.search],
    queryFn: () => inventoryService.list({ page: params.page, pageSize: params.pageSize, search: params.search }),
  });

  const lowStock = query.data?.data.filter((item) => item.status !== 'OK').length ?? 0;
  const totalItems = query.data?.total ?? 0;

  return (
    <PageContainer>
      <PageHeader title="Estoque" description="Itens, reposição e indicadores de criticidade.">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por código interno, nome ou fornecedor" />
          <Button type="button" onClick={() => navigate('/app/estoque/novo')}>
            Nova peça
          </Button>
        </div>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard title="Itens cadastrados" value={String(totalItems)} icon={Boxes} />
        <SummaryCard title="Abaixo do mínimo" value={String(lowStock)} icon={AlertTriangle} />
      </div>
      <Card>
        <CardContent className="p-0">
          {query.isLoading ? <LoadingState /> : null}
          {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
          {!query.isLoading && !query.isError && query.data?.data.length === 0 ? <EmptyState /> : null}
          {query.data?.data.length ? (
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Atual</TableHead>
                    <TableHead>Mínimo</TableHead>
                    <TableHead>Venda</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.internalCode}</TableCell>
                      <TableCell>
                        <div>
                          <p>{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.supplier ?? item.category ?? 'Sem classificação'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.minimumQuantity}</TableCell>
                      <TableCell>{formatCurrency(item.salePrice)}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-6">
                <Pagination page={query.data.page} total={query.data.total} pageSize={query.data.pageSize} onPageChange={params.setPage} />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
