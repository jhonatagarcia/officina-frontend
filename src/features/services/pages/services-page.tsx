import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, DollarSign, Eye, PackageSearch, Pencil, Wrench } from 'lucide-react';
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

const activeImageSrc =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <path d="M20 32l8 8 16-16" stroke="#15803D" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `);

const inactiveImageSrc =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <path d="M24 24l16 16M40 24L24 40" stroke="#B91C1C" stroke-width="6" stroke-linecap="round"/>
    </svg>
  `);

export function ServicesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useListParams();
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicos'] }),
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
      title: 'Ativos na página',
      value: String(activeCount),
      imageAlt: 'Serviços ativos',
      imageSrc: activeImageSrc,
      mediaClassName: 'border border-emerald-200 bg-emerald-50 p-2',
    },
    {
      id: 'inactive',
      title: 'Inativos na página',
      value: String(inactiveCount),
      imageAlt: 'Serviços inativos',
      imageSrc: inactiveImageSrc,
      mediaClassName: 'border border-rose-200 bg-rose-50 p-2',
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
        <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
          <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por nome ou código" />
          <Select
            value={activeFilter}
            onValueChange={(value) => {
              setActiveFilter(value as ActiveFilter);
              params.setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Ativos</SelectItem>
              <SelectItem value="INACTIVE">Inativos</SelectItem>
              <SelectItem value="ALL">Todos</SelectItem>
            </SelectContent>
          </Select>
          <Button className="shrink-0" type="button" onClick={() => navigate('/app/servicos/novo')}>
            Novo serviço
          </Button>
        </div>
      </PageHeader>
      <CustomizableSummaryCards
        storageKey="oficina:servicos:summary-cards:v1"
        cards={summaryCards}
        defaultVisibleIds={['total', 'active', 'inactive']}
        gridClassName="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
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
                      <TableCell>{item.code}</TableCell>
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
                      <TableCell>{formatCurrency(item.suggestedTotalPrice)}</TableCell>
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
              <div className="mt-6">
                <Pagination page={params.page} total={totalItems} pageSize={DEFAULT_TABLE_PAGE_SIZE} onPageChange={params.setPage} />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
