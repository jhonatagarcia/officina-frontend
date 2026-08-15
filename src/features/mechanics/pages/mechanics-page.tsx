import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  KeyRound,
  Eye,
  Pencil,
  Wrench,
  XCircle,
} from 'lucide-react';
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
import { IndicatorHeaderActions } from '@/components/shared/indicator-header-actions';
import { TableFilterChips } from '@/components/shared/table-filter-chips';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mechanicsService } from '@/features/mechanics/services/mechanics-service';
import { DEFAULT_TABLE_PAGE_SIZE } from '@/constants/pagination';
import { useListParams } from '@/hooks/use-list-params';
import { useSortableData } from '@/hooks/use-sortable-data';

type ActiveFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

export function MechanicsPage() {
  const navigate = useNavigate();
  const params = useListParams();
  const [isConfiguringPanel, setIsConfiguringPanel] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('ALL');
  const handleActiveFilterChange = (value: ActiveFilter) => {
    setActiveFilter(value);
    params.setPage(1);
  };

  const query = useQuery({
    queryKey: [
      'mecanicos',
      params.page,
      DEFAULT_TABLE_PAGE_SIZE,
      params.search,
      activeFilter,
    ],
    queryFn: () =>
      mechanicsService.listEmployees({
        page: params.page,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        search: params.search,
        ...(activeFilter !== 'ALL'
          ? { active: activeFilter === 'ACTIVE' }
          : {}),
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
  const inactiveCount = listedItems.filter((item) => !item.isActive).length;
  const withAccessCount = listedItems.filter((item) => item.hasAccess).length;
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
      id: 'with-access',
      title: 'Com conta de acesso',
      value: String(withAccessCount),
      icon: KeyRound,
      mediaClassName: 'border-sky-200 bg-sky-50 text-sky-700',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Mecânicos"
        description="Cadastro e gestão dos mecânicos do negócio."
      >
        <IndicatorHeaderActions
          onAdjustPanel={() => setIsConfiguringPanel((current) => !current)}
          primaryActionLabel="Novo mecânico"
          onPrimaryAction={() => navigate('/inicio/mecanicos/novo')}
        >
          <SearchInput
            value={params.search}
            onChange={params.setSearch}
            placeholder="Buscar por nome"
          />
        </IndicatorHeaderActions>
      </PageHeader>
      <CustomizableSummaryCards
        storageKey="oficina:mecanicos:summary-cards:v1"
        cards={summaryCards}
        defaultVisibleIds={['total', 'active', 'with-access']}
        gridClassName="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        isConfiguring={isConfiguringPanel}
        onConfiguringChange={setIsConfiguringPanel}
        showHeaderAction={false}
      />
      <Card>
        <CardContent className="p-0">
          {query.isLoading ? <LoadingState /> : null}
          {query.isError ? (
            <ErrorState onRetry={() => query.refetch()} />
          ) : null}
          {!query.isLoading && !query.isError && listedItems.length === 0 ? (
            <EmptyState />
          ) : null}
          {query.data ? (
            <TableFilterChips
              value={activeFilter}
              options={[
                {
                  value: 'ALL',
                  label: 'Todos',
                  count: query.data.data.length,
                  icon: Wrench,
                  tone: 'slate',
                },
                {
                  value: 'ACTIVE',
                  label: 'Ativos',
                  count: activeCount,
                  icon: CheckCircle2,
                  tone: 'emerald',
                },
                {
                  value: 'INACTIVE',
                  label: 'Inativos',
                  count: inactiveCount,
                  icon: XCircle,
                  tone: 'rose',
                },
              ]}
              onChange={(value) =>
                handleActiveFilterChange(value as ActiveFilter)
              }
            />
          ) : null}
          {listedItems.length ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      column="name"
                      sortState={sortState}
                      onSort={requestSort}
                    >
                      Nome
                    </SortableTableHead>
                    <SortableTableHead
                      column="status"
                      sortState={sortState}
                      onSort={requestSort}
                    >
                      Status
                    </SortableTableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? 'success' : 'danger'}>
                          {item.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {item.hasAccess
                            ? 'Conta vinculada'
                            : 'Sem conta vinculada'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              navigate(`/inicio/mecanicos/${item.id}`)
                            }
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              navigate(`/inicio/mecanicos/${item.id}/editar`)
                            }
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-5">
                <Pagination
                  page={query.data!.page}
                  total={query.data!.total}
                  pageSize={query.data!.pageSize}
                  onPageChange={params.setPage}
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
