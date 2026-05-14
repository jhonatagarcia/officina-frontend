import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Eye, Pencil, Wrench, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { CustomizableSummaryCards } from '@/components/shared/customizable-widgets';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableTableHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mechanicsService } from '@/features/mechanics/services/mechanics-service';
import { DEFAULT_TABLE_PAGE_SIZE } from '@/constants/pagination';
import { useListParams } from '@/hooks/use-list-params';
import { useSortableData } from '@/hooks/use-sortable-data';
import { formatDateOnly } from '@/lib/utils';

type ActiveFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

export function MechanicsPage() {
  const navigate = useNavigate();
  const params = useListParams();
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('ALL');
  const handleActiveFilterChange = (value: ActiveFilter) => {
    setActiveFilter(value);
    params.setPage(1);
  };

  const query = useQuery({
    queryKey: ['mecanicos', params.page, DEFAULT_TABLE_PAGE_SIZE, params.search, activeFilter],
    queryFn: () =>
      mechanicsService.list({
        page: params.page,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        search: params.search,
        active: activeFilter === 'ALL' ? undefined : activeFilter === 'ACTIVE',
      }),
  });

  const listedItems = query.data?.data ?? [];
  const { sortedItems, sortState, requestSort } = useSortableData(listedItems, {
    initialSort: { column: 'name', direction: 'asc' },
    accessors: {
      name: (item) => item.name,
      email: (item) => item.email,
      status: (item) => item.isActive,
      lastLoginAt: (item) => (item.lastLoginAt ? new Date(item.lastLoginAt) : null),
    },
  });
  const activeCount = listedItems.filter((item) => item.isActive).length;
  const inactiveCount = listedItems.filter((item) => !item.isActive).length;
  const withLastLoginCount = listedItems.filter((item) => item.lastLoginAt).length;
  const summaryCards = [
    {
      id: 'total',
      title: 'Mecânicos listados',
      value: String(query.data?.total ?? 0),
      icon: Wrench,
      mediaClassName: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'active',
      title: 'Ativos nesta página',
      value: String(activeCount),
      icon: CheckCircle2,
      mediaClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      id: 'inactive',
      title: 'Inativos nesta página',
      value: String(inactiveCount),
      icon: XCircle,
      mediaClassName: 'border-rose-200 bg-rose-50 text-rose-700',
    },
    {
      id: 'last-login',
      title: 'Com último acesso',
      value: String(withLastLoginCount),
      icon: Clock,
      mediaClassName: 'border-sky-200 bg-sky-50 text-sky-700',
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="Mecânicos" description="Cadastro e gestão dos mecânicos da oficina.">
        <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
          <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por nome ou e-mail" />
          <Select value={activeFilter} onValueChange={(value) => handleActiveFilterChange(value as ActiveFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="ACTIVE">Ativos</SelectItem>
              <SelectItem value="INACTIVE">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Button className="shrink-0" type="button" onClick={() => navigate('/app/mecanicos/novo')}>
            Novo mecânico
          </Button>
        </div>
      </PageHeader>
      <CustomizableSummaryCards
        storageKey="oficina:mecanicos:summary-cards:v1"
        cards={summaryCards}
        defaultVisibleIds={['total', 'active', 'last-login']}
        gridClassName="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      />
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
                    <SortableTableHead column="email" sortState={sortState} onSort={requestSort}>E-mail</SortableTableHead>
                    <SortableTableHead column="status" sortState={sortState} onSort={requestSort}>Status</SortableTableHead>
                    <SortableTableHead column="lastLoginAt" sortState={sortState} onSort={requestSort}>Último acesso</SortableTableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? 'success' : 'danger'}>{item.isActive ? 'Ativo' : 'Inativo'}</Badge>
                      </TableCell>
                      <TableCell>{item.lastLoginAt ? formatDateOnly(item.lastLoginAt) : '-'}</TableCell>
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
