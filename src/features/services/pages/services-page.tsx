import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, DollarSign, Eye, PackageSearch, Pencil, Wrench, XCircle } from 'lucide-react';
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
import { PlateChip } from '@/components/shared/table-identity-cells';
import { TableFilterChips } from '@/components/shared/table-filter-chips';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SortableTableHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { servicesService } from '@/features/services/services/services-service';
import { DEFAULT_TABLE_PAGE_SIZE } from '@/constants/pagination';
import { useListParams } from '@/hooks/use-list-params';
import { useSortableData } from '@/hooks/use-sortable-data';
import { formatCurrency } from '@/lib/utils';

type ActiveFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

const billingTypeLabelMap = {
  LABOR_ONLY: 'Mão de obra',
  PARTS_AND_LABOR: 'Peças e mão de obra',
  FIXED_PRICE: 'Preço fixo',
} as const;

export function ServicesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useListParams();
  const [isConfiguringPanel, setIsConfiguringPanel] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('ALL');

  const query = useQuery({
    queryKey: ['servicos', params.search],
    queryFn: () =>
      servicesService.list({
        page: 1,
        pageSize: 100,
        search: params.search,
      }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? servicesService.deactivate(id) : servicesService.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      queryClient.invalidateQueries({ queryKey: ['reference', 'servicos'] });
    },
  });

  const fetchedItems = query.data?.data ?? [];
  const filteredItems = fetchedItems.filter((item) => {
    if (activeFilter === 'ALL') return true;
    return activeFilter === 'ACTIVE' ? item.active : !item.active;
  });
  const { sortedItems, sortState, requestSort } = useSortableData(filteredItems, {
    initialSort: { column: 'code', direction: 'asc' },
    accessors: {
      code: (item) => item.code,
      service: (item) => item.name,
      category: (item) => item.category,
      billingType: (item) => billingTypeLabelMap[item.billingType],
      suggestedTotalPrice: (item) => item.suggestedTotalPrice,
      status: (item) => item.active,
    },
  });
  const listedItems = sortedItems.slice((params.page - 1) * DEFAULT_TABLE_PAGE_SIZE, params.page * DEFAULT_TABLE_PAGE_SIZE);
  const totalItems = filteredItems.length;
  const activeCount = listedItems.filter((item) => item.active).length;
  const inactiveCount = listedItems.filter((item) => !item.active).length;
  const fixedPriceCount = listedItems.filter((item) => item.billingType === 'FIXED_PRICE').length;
  const partsAndLaborCount = listedItems.filter((item) => item.billingType === 'PARTS_AND_LABOR').length;
  const suggestedTotal = listedItems.reduce((total, item) => total + item.suggestedTotalPrice, 0);
  const summaryCards = [
    {
      id: 'total',
      title: 'Serviços listados',
      value: String(totalItems),
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
      id: 'fixed-price',
      title: 'Preço fixo',
      value: String(fixedPriceCount),
      icon: DollarSign,
      mediaClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    {
      id: 'parts-labor',
      title: 'Peças e mão de obra',
      value: String(partsAndLaborCount),
      icon: PackageSearch,
      mediaClassName: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    {
      id: 'suggested-total',
      title: 'Total sugerido',
      value: formatCurrency(suggestedTotal),
      icon: CheckCircle2,
      valueClassName: 'text-emerald-600',
      mediaClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="Serviços" description="Catálogo padronizado de serviços para orçamento e ordem de serviço.">
        <IndicatorHeaderActions
          onAdjustPanel={() => setIsConfiguringPanel((current) => !current)}
          primaryActionLabel="Novo serviço"
          onPrimaryAction={() => navigate('/app/servicos/novo')}
        >
          <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por nome ou código" />
        </IndicatorHeaderActions>
      </PageHeader>
      <CustomizableSummaryCards
        storageKey="oficina:servicos:summary-cards:v1"
        cards={summaryCards}
        defaultVisibleIds={['total', 'active', 'inactive']}
        gridClassName="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        isConfiguring={isConfiguringPanel}
        onConfiguringChange={setIsConfiguringPanel}
        showHeaderAction={false}
      />
      <Card>
        <CardContent className="p-0">
          {query.isLoading ? <LoadingState /> : null}
          {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
          {!query.isLoading && !query.isError && listedItems.length === 0 ? <EmptyState /> : null}
          {query.data ? (
            <TableFilterChips
              value={activeFilter}
              options={[
                { value: 'ALL', label: 'Todos', count: query.data.data.length, icon: Wrench, tone: 'slate' },
                { value: 'ACTIVE', label: 'Ativos', count: fetchedItems.filter((item) => item.active).length, icon: CheckCircle2, tone: 'emerald' },
                { value: 'INACTIVE', label: 'Inativos', count: fetchedItems.filter((item) => !item.active).length, icon: XCircle, tone: 'rose' },
              ]}
              onChange={(value) => {
                setActiveFilter(value as ActiveFilter);
                params.setPage(1);
              }}
            />
          ) : null}
          {listedItems.length ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="code" sortState={sortState} onSort={requestSort}>Código</SortableTableHead>
                    <SortableTableHead column="service" sortState={sortState} onSort={requestSort}>Serviço</SortableTableHead>
                    <SortableTableHead column="category" sortState={sortState} onSort={requestSort}>Categoria</SortableTableHead>
                    <SortableTableHead column="billingType" sortState={sortState} onSort={requestSort}>Cobrança</SortableTableHead>
                    <SortableTableHead column="suggestedTotalPrice" sortState={sortState} onSort={requestSort}>Total sugerido</SortableTableHead>
                    <SortableTableHead column="status" sortState={sortState} onSort={requestSort}>Status</SortableTableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell><PlateChip>{item.code}</PlateChip></TableCell>
                      <TableCell>
                        <div>
                          <p>{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.description ?? 'Sem descrição cadastrada'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p>{item.category}</p>
                      </TableCell>
                      <TableCell>{billingTypeLabelMap[item.billingType]}</TableCell>
                      <TableCell className="font-bold [font-variant-numeric:tabular-nums]">{formatCurrency(item.suggestedTotalPrice)}</TableCell>
                      <TableCell>
                        <Badge variant={item.active ? 'success' : 'danger'}>{item.active ? 'Ativo' : 'Inativo'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="outline" onClick={() => navigate(`/app/servicos/${item.id}`)}>
                            <Eye className="size-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => navigate(`/app/servicos/${item.id}/editar`)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={toggleActiveMutation.isPending}
                            onClick={() => toggleActiveMutation.mutate({ id: item.id, active: item.active })}
                          >
                            {item.active ? 'Inativar' : 'Ativar'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-5">
                <Pagination page={params.page} total={totalItems} pageSize={DEFAULT_TABLE_PAGE_SIZE} onPageChange={params.setPage} />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
