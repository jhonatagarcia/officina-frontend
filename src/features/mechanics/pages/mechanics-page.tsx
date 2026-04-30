import { useQuery } from '@tanstack/react-query';
import { Eye, Pencil, Wrench } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { SummaryCard } from '@/components/shared/summary-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableTableHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mechanicsService } from '@/features/mechanics/services/mechanics-service';
import { useListParams } from '@/hooks/use-list-params';
import { useSortableData } from '@/hooks/use-sortable-data';

type ActiveFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

export function MechanicsPage() {
  const navigate = useNavigate();
  const params = useListParams();
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('ALL');

  const query = useQuery({
    queryKey: ['mecanicos', params.page, params.search, activeFilter],
    queryFn: () =>
      mechanicsService.list({
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        active: activeFilter === 'ALL' ? undefined : activeFilter === 'ACTIVE',
      }),
  });

  const listedItems = query.data?.data ?? [];
  const { sortedItems, sortState, requestSort } = useSortableData(listedItems, {
    initialSort: { column: 'name', direction: 'asc' },
    accessors: {
      name: (item) => item.name,
      status: (item) => item.isActive,
    },
  });
  const activeCount = listedItems.filter((item) => item.isActive).length;

  return (
    <PageContainer>
      <PageHeader title="Mecânicos" description="Cadastro e gestão dos mecânicos da oficina.">
        <div className="flex flex-col gap-3 lg:flex-row">
          <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por nome ou e-mail" />
          <Select value={activeFilter} onValueChange={(value) => setActiveFilter(value as ActiveFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Ativos</SelectItem>
              <SelectItem value="INACTIVE">Inativos</SelectItem>
              <SelectItem value="ALL">Todos</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" onClick={() => navigate('/app/mecanicos/novo')}>
            Novo mecânico
          </Button>
        </div>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard title="Mecânicos listados" value={String(query.data?.total ?? 0)} icon={Wrench} />
        <SummaryCard title="Ativos na página" value={String(activeCount)} icon={Wrench} />
      </div>
      <Card>
        <CardContent className="p-0">
          {query.isLoading ? <LoadingState /> : null}
          {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
          {!query.isLoading && !query.isError && listedItems.length === 0 ? <EmptyState /> : null}
          {listedItems.length ? (
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="name" sortState={sortState} onSort={requestSort}>Nome</SortableTableHead>
                    <SortableTableHead column="status" sortState={sortState} onSort={requestSort}>Status</SortableTableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? 'success' : 'danger'}>{item.isActive ? 'Ativo' : 'Inativo'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="outline" onClick={() => navigate(`/app/mecanicos/${item.id}`)}>
                            <Eye className="size-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => navigate(`/app/mecanicos/${item.id}/editar`)}>
                            <Pencil className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-6">
                <Pagination page={query.data!.page} total={query.data!.total} pageSize={query.data!.pageSize} onPageChange={params.setPage} />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
