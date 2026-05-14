import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '@/features/inventory/services/inventory-service';
import { useListParams } from '@/hooks/use-list-params';
import { useSortableData } from '@/hooks/use-sortable-data';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { CustomizableSummaryCards } from '@/components/shared/customizable-widgets';
import { StatusBadge } from '@/components/shared/status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SortableTableHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Boxes, CheckCircle2, DollarSign, Hash, Pencil } from 'lucide-react';
import { DEFAULT_TABLE_PAGE_SIZE } from '@/constants/pagination';
import { cn, formatCurrency } from '@/lib/utils';

function getInventoryRowClass(status: string) {
  if (status === 'CRITICO') return 'bg-rose-50/45 hover:bg-rose-50/70';
  if (status === 'BAIXO') return 'bg-amber-50/35 hover:bg-amber-50/60';
  return undefined;
}

export function InventoryPage() {
  const navigate = useNavigate();
  const params = useListParams();
  const query = useQuery({
    queryKey: ['estoque', params.page, DEFAULT_TABLE_PAGE_SIZE, params.search],
    queryFn: () => inventoryService.list({ page: params.page, pageSize: DEFAULT_TABLE_PAGE_SIZE, search: params.search }),
  });

  const lowStock = query.data?.data.filter((item) => item.status === 'BAIXO').length ?? 0;
  const totalItems = query.data?.total ?? 0;
  const inventoryItems = query.data?.data ?? [];
  const okStock = inventoryItems.filter((item) => item.status === 'OK').length;
  const criticalStock = inventoryItems.filter((item) => item.status === 'CRITICO').length;
  const pageItemsCount = inventoryItems.length;
  const inventoryValue = inventoryItems.reduce((total, item) => total + item.quantity * item.salePrice, 0);
  const summaryCards = [
    {
      id: 'total',
      title: 'Itens cadastrados',
      value: String(totalItems),
      icon: Boxes,
      mediaClassName: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'alert',
      title: 'Estoque baixo',
      value: String(lowStock),
      icon: AlertTriangle,
      mediaClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    {
      id: 'critical',
      title: 'Estoque crítico',
      value: String(criticalStock),
      icon: AlertTriangle,
      mediaClassName: 'border-rose-200 bg-rose-50 text-rose-700',
    },
    {
      id: 'quantity',
      title: 'Itens na página',
      value: String(pageItemsCount),
      icon: Hash,
      mediaClassName: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    {
      id: 'ok',
      title: 'Estoque OK',
      value: String(okStock),
      icon: CheckCircle2,
      mediaClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      id: 'value',
      title: 'Valor da página',
      value: formatCurrency(inventoryValue),
      icon: DollarSign,
      valueClassName: 'text-emerald-600',
      mediaClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
  ];
  const { sortedItems, sortState, requestSort } = useSortableData(inventoryItems, {
    initialSort: { column: 'internalCode', direction: 'asc' },
    accessors: {
      internalCode: (item) => item.internalCode,
      item: (item) => item.name,
      quantity: (item) => item.quantity,
      minimumQuantity: (item) => item.minimumQuantity,
      salePrice: (item) => item.salePrice,
      status: (item) => item.status,
    },
  });

  return (
    <PageContainer>
      <PageHeader title="Estoque" description="Itens, reposição e indicadores de criticidade.">
        <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
          <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por ID, nome ou fornecedor" />
          <Button className="shrink-0" type="button" onClick={() => navigate('/app/estoque/novo')}>
            Nova peça
          </Button>
        </div>
      </PageHeader>
      <CustomizableSummaryCards
        storageKey="oficina:estoque:summary-cards:v1"
        cards={summaryCards}
        defaultVisibleIds={['critical', 'alert', 'total']}
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
                    <SortableTableHead column="internalCode" sortState={sortState} onSort={requestSort}>ID</SortableTableHead>
                    <SortableTableHead column="item" sortState={sortState} onSort={requestSort}>Item</SortableTableHead>
                    <SortableTableHead column="quantity" sortState={sortState} onSort={requestSort}>Atual</SortableTableHead>
                    <SortableTableHead column="minimumQuantity" sortState={sortState} onSort={requestSort}>Mínimo</SortableTableHead>
                    <SortableTableHead column="salePrice" sortState={sortState} onSort={requestSort}>Venda</SortableTableHead>
                    <SortableTableHead column="status" sortState={sortState} onSort={requestSort}>Status</SortableTableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => (
                    <TableRow key={item.id} className={getInventoryRowClass(item.status)}>
                      <TableCell>{item.internalCode}</TableCell>
                      <TableCell>
                        <div>
                          <p>{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.supplier ?? item.category ?? 'Sem classificação'}</p>
                        </div>
                      </TableCell>
                      <TableCell className={cn(item.status === 'CRITICO' ? 'font-semibold text-rose-700' : item.status === 'BAIXO' ? 'font-medium text-amber-700' : null)}>
                        {item.quantity}
                      </TableCell>
                      <TableCell>{item.minimumQuantity}</TableCell>
                      <TableCell>{formatCurrency(item.salePrice)}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => navigate(`/app/estoque/${item.id}/editar`)}
                            aria-label={`Editar item ${item.internalCode}`}
                          >
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
