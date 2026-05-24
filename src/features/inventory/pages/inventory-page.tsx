import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '@/features/inventory/services/inventory-service';
import { useListParams } from '@/hooks/use-list-params';
import { useSortableData } from '@/hooks/use-sortable-data';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { CustomizableSummaryCards } from '@/components/shared/customizable-widgets';
import { IndicatorHeaderActions } from '@/components/shared/indicator-header-actions';
import { PlateChip } from '@/components/shared/table-identity-cells';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SortableTableHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, AlertTriangle, Boxes, CheckCircle2, CircleX, DollarSign, Eye, Hash, PackagePlus, Pencil } from 'lucide-react';
import { DEFAULT_TABLE_PAGE_SIZE } from '@/constants/pagination';
import { cn, formatCurrency } from '@/lib/utils';
import type { InventoryStatus } from '@/features/inventory/types';

type StockFilter = 'ALL' | 'OK' | 'BAIXO' | 'CRITICO' | 'ESGOTADO';

function getInventoryRowClass(status: InventoryStatus, quantity: number) {
  if (quantity <= 0 || status === 'CRITICO') return 'border-l-4 border-l-rose-600 hover:bg-stone-50/80';
  if (status === 'BAIXO') return 'border-l-4 border-l-amber-500 hover:bg-stone-50/80';
  return undefined;
}

function getStockTone(status: InventoryStatus, quantity: number) {
  if (quantity <= 0 || status === 'CRITICO') return 'rose';
  if (status === 'BAIXO') return 'amber';
  return 'emerald';
}

function StockStatusPill({ status, quantity }: { status: InventoryStatus; quantity: number }) {
  const tone = getStockTone(status, quantity);
  const label = quantity <= 0 ? 'Esgotado' : status === 'CRITICO' ? 'Estoque crítico' : status === 'BAIXO' ? 'Estoque baixo' : 'Estoque OK';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold',
        tone === 'emerald' && 'bg-emerald-50 text-emerald-700',
        tone === 'amber' && 'bg-amber-50 text-amber-700',
        tone === 'rose' && 'bg-rose-50 text-rose-700',
      )}
    >
      <span className={cn('size-2 rounded-full', tone === 'emerald' && 'bg-emerald-500', tone === 'amber' && 'bg-amber-500', tone === 'rose' && 'bg-rose-600')} />
      {label}
    </span>
  );
}

function StockLevel({ quantity, minimumQuantity, status }: { quantity: number; minimumQuantity: number; status: InventoryStatus }) {
  const target = Math.max(minimumQuantity * 2, quantity, 1);
  const currentPercent = Math.min(100, Math.max(4, (quantity / target) * 100));
  const minimumPercent = Math.min(100, Math.max(4, (minimumQuantity / target) * 100));
  const tone = getStockTone(status, quantity);

  return (
    <div className="flex min-w-[250px] items-center gap-4">
      <div className="relative h-2 w-44 overflow-hidden rounded-full bg-stone-100">
        <div
          className={cn('h-full rounded-full', tone === 'emerald' && 'bg-emerald-600', tone === 'amber' && 'bg-amber-500', tone === 'rose' && 'bg-rose-600')}
          style={{ width: `${currentPercent}%` }}
        />
        <span className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-stone-500/60" style={{ left: `${minimumPercent}%` }} />
      </div>
      <div className="whitespace-nowrap text-sm">
        <span className={cn('font-bold', tone === 'emerald' && 'text-emerald-700', tone === 'amber' && 'text-amber-700', tone === 'rose' && 'text-rose-700')}>
          {quantity}
        </span>
        <span className="mx-1 text-muted-foreground">/</span>
        <span className="text-muted-foreground">mín {minimumQuantity}</span>
      </div>
    </div>
  );
}

function StockFilterButton({
  active,
  count,
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  active: boolean;
  count: number;
  icon: typeof Boxes;
  label: string;
  tone: 'slate' | 'emerald' | 'amber' | 'rose' | 'red';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold shadow-xs transition',
        active ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-border bg-white text-muted-foreground hover:border-border-strong hover:text-foreground',
      )}
      onClick={onClick}
    >
      <Icon
        className={cn(
          'size-4',
          !active && tone === 'emerald' && 'text-emerald-600',
          !active && tone === 'amber' && 'text-amber-600',
          !active && (tone === 'rose' || tone === 'red') && 'text-rose-700',
        )}
        strokeWidth={1.75}
      />
      {label}
      <span className={cn('rounded-full px-2 py-0.5 text-xs', active ? 'bg-white/15 text-white' : 'bg-stone-100 text-muted-foreground')}>{count}</span>
    </button>
  );
}

export function InventoryPage() {
  const navigate = useNavigate();
  const params = useListParams();
  const [isConfiguringPanel, setIsConfiguringPanel] = useState(false);
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');
  const query = useQuery({
    queryKey: ['estoque', params.page, DEFAULT_TABLE_PAGE_SIZE, params.search],
    queryFn: () => inventoryService.list({ page: params.page, pageSize: DEFAULT_TABLE_PAGE_SIZE, search: params.search }),
  });

  const lowStock = query.data?.data.filter((item) => item.status === 'BAIXO').length ?? 0;
  const totalItems = query.data?.total ?? 0;
  const inventoryItems = query.data?.data ?? [];
  const okStock = inventoryItems.filter((item) => item.status === 'OK').length;
  const criticalStock = inventoryItems.filter((item) => item.status === 'CRITICO').length;
  const outOfStock = inventoryItems.filter((item) => item.quantity <= 0).length;
  const filteredInventoryItems = inventoryItems.filter((item) => {
    if (stockFilter === 'ALL') return true;
    if (stockFilter === 'ESGOTADO') return item.quantity <= 0;
    if (stockFilter === 'CRITICO') return item.status === 'CRITICO' && item.quantity > 0;
    return item.status === stockFilter;
  });
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
  const { sortedItems, sortState, requestSort } = useSortableData(filteredInventoryItems, {
    initialSort: { column: 'internalCode', direction: 'asc' },
    accessors: {
      internalCode: (item) => item.internalCode,
      item: (item) => item.name,
      category: (item) => item.category,
      quantity: (item) => item.quantity,
      minimumQuantity: (item) => item.minimumQuantity,
      salePrice: (item) => item.salePrice,
      status: (item) => item.status,
    },
  });

  return (
    <PageContainer>
      <PageHeader title="Estoque" description="Itens, reposição e indicadores de criticidade.">
        <IndicatorHeaderActions
          onAdjustPanel={() => setIsConfiguringPanel((current) => !current)}
          primaryActionLabel="Nova peça"
          onPrimaryAction={() => navigate('/app/estoque/novo')}
        >
          <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por ID, nome ou fornecedor" />
        </IndicatorHeaderActions>
      </PageHeader>
      <CustomizableSummaryCards
        storageKey="oficina:estoque:summary-cards:v1"
        cards={summaryCards}
        defaultVisibleIds={['critical', 'alert', 'total']}
        gridClassName="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        isConfiguring={isConfiguringPanel}
        onConfiguringChange={setIsConfiguringPanel}
        showHeaderAction={false}
      />
      <Card>
        <CardContent className="p-0">
          {query.isLoading ? <LoadingState /> : null}
          {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
          {!query.isLoading && !query.isError && query.data?.data.length === 0 ? <EmptyState /> : null}
          {query.data ? (
            <>
              <div className="flex flex-wrap gap-2 border-b border-border-soft p-4">
                <StockFilterButton active={stockFilter === 'ALL'} count={inventoryItems.length} icon={Boxes} label="Todos" tone="slate" onClick={() => setStockFilter('ALL')} />
                <StockFilterButton active={stockFilter === 'OK'} count={okStock} icon={CheckCircle2} label="Estoque OK" tone="emerald" onClick={() => setStockFilter('OK')} />
                <StockFilterButton active={stockFilter === 'BAIXO'} count={lowStock} icon={AlertCircle} label="Estoque baixo" tone="amber" onClick={() => setStockFilter('BAIXO')} />
                <StockFilterButton active={stockFilter === 'CRITICO'} count={Math.max(criticalStock - outOfStock, 0)} icon={AlertTriangle} label="Estoque crítico" tone="rose" onClick={() => setStockFilter('CRITICO')} />
                <StockFilterButton active={stockFilter === 'ESGOTADO'} count={outOfStock} icon={CircleX} label="Esgotado" tone="red" onClick={() => setStockFilter('ESGOTADO')} />
              </div>
              {sortedItems.length ? (
              <div className="overflow-x-auto">
              <Table className="min-w-[1180px]">
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="item" sortState={sortState} onSort={requestSort}>Item</SortableTableHead>
                    <SortableTableHead column="category" sortState={sortState} onSort={requestSort}>Categoria</SortableTableHead>
                    <SortableTableHead column="quantity" sortState={sortState} onSort={requestSort}>Nível de estoque</SortableTableHead>
                    <SortableTableHead column="salePrice" sortState={sortState} onSort={requestSort}>Preço venda</SortableTableHead>
                    <SortableTableHead column="status" sortState={sortState} onSort={requestSort}>Status</SortableTableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => (
                    <TableRow key={item.id} className={getInventoryRowClass(item.status, item.quantity)}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-bold text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            <PlateChip>{item.internalCode}</PlateChip>
                            {item.supplier ? <span className="ml-2">· {item.supplier}</span> : null}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{item.category ?? 'Sem categoria'}</TableCell>
                      <TableCell>
                        <StockLevel quantity={item.quantity} minimumQuantity={item.minimumQuantity} status={item.status} />
                      </TableCell>
                      <TableCell className="font-bold [font-variant-numeric:tabular-nums]">{formatCurrency(item.salePrice)}</TableCell>
                      <TableCell><StockStatusPill status={item.status} quantity={item.quantity} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {item.status !== 'OK' || item.quantity <= 0 ? (
                            <Button
                              className="h-9 rounded-lg border-primary/20 bg-primary-soft px-3 text-primary hover:bg-primary/10 hover:text-primary"
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/app/estoque/${item.id}/editar`)}
                            >
                              <PackagePlus className="size-4" strokeWidth={1.75} />
                              Repor
                            </Button>
                          ) : null}
                          <Button
                            className="size-9 rounded-lg bg-white"
                            size="icon"
                            variant="outline"
                            onClick={() => navigate(`/app/estoque/${item.id}/editar`)}
                            aria-label={`Ver item ${item.internalCode}`}
                          >
                            <Eye className="size-4" strokeWidth={1.75} />
                          </Button>
                          <Button
                            className="size-9 rounded-lg bg-white"
                            size="icon"
                            variant="outline"
                            onClick={() => navigate(`/app/estoque/${item.id}/editar`)}
                            aria-label={`Editar item ${item.internalCode}`}
                          >
                            <Pencil className="size-4" strokeWidth={1.75} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-5">
                <Pagination page={query.data.page} total={query.data.total} pageSize={query.data.pageSize} onPageChange={params.setPage} />
              </div>
            </div>
              ) : (
                <EmptyState />
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
