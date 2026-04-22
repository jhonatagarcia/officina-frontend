import { useQuery } from '@tanstack/react-query';
import { Eye, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { vehiclesService } from '@/features/vehicles/services/vehicles-service';
import { useListParams } from '@/hooks/use-list-params';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function VehiclesPage() {
  const navigate = useNavigate();
  const params = useListParams();
  const query = useQuery({
    queryKey: ['veiculos', params.page, params.search],
    queryFn: () => vehiclesService.list({ page: params.page, pageSize: params.pageSize, search: params.search }),
  });

  return (
    <PageContainer>
      <PageHeader title="Veículos" description="Controle da frota atendida pela oficina." actionLabel="Novo veículo" onAction={() => navigate('/app/veiculos/novo')}>
        <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por placa, marca, modelo ou cliente" />
      </PageHeader>
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
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.data.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{vehicle.plate}</TableCell>
                      <TableCell>{vehicle.brand} {vehicle.model}</TableCell>
                      <TableCell>{vehicle.clientName ?? '-'}</TableCell>
                      <TableCell>{vehicle.year}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="outline" onClick={() => navigate(`/app/veiculos/${vehicle.id}`)}>
                            <Eye className="size-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => navigate(`/app/veiculos/${vehicle.id}/editar`)}>
                            <Pencil className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
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
