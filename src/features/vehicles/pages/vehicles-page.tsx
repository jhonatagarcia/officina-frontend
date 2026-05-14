import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Car, Eye, Gauge, Hash, Pencil, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { vehiclesService } from '@/features/vehicles/services/vehicles-service';
import { useListParams } from '@/hooks/use-list-params';
import { useSortableData } from '@/hooks/use-sortable-data';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { CustomizableSummaryCards } from '@/components/shared/customizable-widgets';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SortableTableHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DEFAULT_TABLE_PAGE_SIZE } from '@/constants/pagination';

export function VehiclesPage() {
  const navigate = useNavigate();
  const params = useListParams();
  const query = useQuery({
    queryKey: ['veiculos', params.page, DEFAULT_TABLE_PAGE_SIZE, params.search],
    queryFn: () => vehiclesService.list({ page: params.page, pageSize: DEFAULT_TABLE_PAGE_SIZE, search: params.search }),
  });
  const vehicles = query.data?.data ?? [];
  const vehiclesWithClientCount = vehicles.filter((vehicle) => vehicle.clientName).length;
  const vehiclesWithMileageCount = vehicles.filter((vehicle) => vehicle.mileage !== null).length;
  const newestVehicleYear = vehicles.length ? Math.max(...vehicles.map((vehicle) => vehicle.year)) : null;
  const summaryCards = [
    {
      id: 'total',
      title: 'Veículos cadastrados',
      value: String(query.data?.total ?? 0),
      icon: Car,
      mediaClassName: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'page',
      title: 'Veículos nesta página',
      value: String(vehicles.length),
      icon: Hash,
      mediaClassName: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    {
      id: 'with-client',
      title: 'Com cliente vinculado',
      value: String(vehiclesWithClientCount),
      icon: Users,
      mediaClassName: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    {
      id: 'with-mileage',
      title: 'Com quilometragem',
      value: String(vehiclesWithMileageCount),
      icon: Gauge,
      mediaClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    {
      id: 'newest-year',
      title: 'Ano mais recente',
      value: newestVehicleYear ? String(newestVehicleYear) : '-',
      icon: CalendarDays,
      mediaClassName: 'border-violet-200 bg-violet-50 text-violet-700',
    },
  ];
  const { sortedItems, sortState, requestSort } = useSortableData(vehicles, {
    initialSort: { column: 'plate', direction: 'asc' },
    accessors: {
      plate: (vehicle) => vehicle.plate,
      model: (vehicle) => `${vehicle.brand} ${vehicle.model}`,
      client: (vehicle) => vehicle.clientName,
      year: (vehicle) => vehicle.year,
    },
  });

  return (
    <PageContainer>
      <PageHeader title="Veículos" description="Controle da frota atendida pela oficina.">
        <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por placa, marca, modelo ou cliente" />
        <Button className="shrink-0" onClick={() => navigate('/app/veiculos/novo')}>Novo veículo</Button>
      </PageHeader>
      <CustomizableSummaryCards
        storageKey="oficina:veiculos:summary-cards:v1"
        cards={summaryCards}
        defaultVisibleIds={['total', 'with-client', 'with-mileage']}
        gridClassName="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      />
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
                    <SortableTableHead column="plate" sortState={sortState} onSort={requestSort}>Placa</SortableTableHead>
                    <SortableTableHead column="model" sortState={sortState} onSort={requestSort}>Modelo</SortableTableHead>
                    <SortableTableHead column="client" sortState={sortState} onSort={requestSort}>Cliente</SortableTableHead>
                    <SortableTableHead column="year" sortState={sortState} onSort={requestSort}>Ano</SortableTableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((vehicle) => (
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
