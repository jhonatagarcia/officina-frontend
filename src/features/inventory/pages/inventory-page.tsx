import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '@/features/inventory/services/inventory-service';
import type { InventoryItem } from '@/features/inventory/types';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Boxes, Pencil, Save, X } from 'lucide-react';
import { formatCurrency, parseCurrencyInput } from '@/lib/utils';

interface InventoryEditForm {
  id: string;
  name: string;
  category: string;
  supplier: string;
  quantity: number;
  minimumQuantity: number;
  cost: number;
  salePrice: number;
}

function toEditForm(item: InventoryItem): InventoryEditForm {
  return {
    id: item.id,
    name: item.name,
    category: item.category ?? '',
    supplier: item.supplier ?? '',
    quantity: item.quantity,
    minimumQuantity: item.minimumQuantity,
    cost: item.cost,
    salePrice: item.salePrice,
  };
}

export function InventoryPage() {
  const navigate = useNavigate();
  const params = useListParams();
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<InventoryEditForm | null>(null);
  const query = useQuery({
    queryKey: ['estoque', params.page, params.search],
    queryFn: () => inventoryService.list({ page: params.page, pageSize: params.pageSize, search: params.search }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<InventoryItem> }) => inventoryService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
      setEditingItem(null);
    },
  });

  const lowStock = query.data?.data.filter((item) => item.status !== 'OK').length ?? 0;
  const totalItems = query.data?.total ?? 0;

  function handleEditChange<K extends keyof InventoryEditForm>(field: K, value: InventoryEditForm[K]) {
    setEditingItem((current) => (current ? { ...current, [field]: value } : current));
  }

  function handleSaveEdit() {
    if (!editingItem) return;

    updateMutation.mutate({
      id: editingItem.id,
      payload: {
        name: editingItem.name.trim(),
        category: editingItem.category.trim() || null,
        supplier: editingItem.supplier.trim() || null,
        quantity: editingItem.quantity,
        minimumQuantity: editingItem.minimumQuantity,
        cost: editingItem.cost,
        salePrice: editingItem.salePrice,
      },
    });
  }

  return (
    <PageContainer>
      <PageHeader title="Estoque" description="Itens, reposição e indicadores de criticidade.">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por ID, nome ou fornecedor" />
          <Button type="button" onClick={() => navigate('/app/estoque/novo')}>
            Nova peça
          </Button>
        </div>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard title="Itens cadastrados" value={String(totalItems)} icon={Boxes} />
        <SummaryCard title="Estoque em alerta" value={String(lowStock)} icon={AlertTriangle} />
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
                    <TableHead>ID</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Atual</TableHead>
                    <TableHead>Mínimo</TableHead>
                    <TableHead>Venda</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.internalCode}</TableCell>
                      <TableCell>
                        {editingItem?.id === item.id ? (
                          <div className="space-y-2">
                            <Input value={editingItem.name} onChange={(event) => handleEditChange('name', event.target.value)} />
                            <div className="grid gap-2 md:grid-cols-2">
                              <Input
                                placeholder="Categoria"
                                value={editingItem.category}
                                onChange={(event) => handleEditChange('category', event.target.value)}
                              />
                              <Input
                                placeholder="Fornecedor"
                                value={editingItem.supplier}
                                onChange={(event) => handleEditChange('supplier', event.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p>{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.supplier ?? item.category ?? 'Sem classificação'}</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingItem?.id === item.id ? (
                          <Input
                            type="number"
                            min={0}
                            value={editingItem.quantity}
                            onChange={(event) => handleEditChange('quantity', Number(event.target.value))}
                          />
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      <TableCell>
                        {editingItem?.id === item.id ? (
                          <Input
                            type="number"
                            min={0}
                            value={editingItem.minimumQuantity}
                            onChange={(event) => handleEditChange('minimumQuantity', Number(event.target.value))}
                          />
                        ) : (
                          item.minimumQuantity
                        )}
                      </TableCell>
                      <TableCell>
                        {editingItem?.id === item.id ? (
                          <div className="space-y-2">
                            <Input
                              inputMode="numeric"
                              value={formatCurrency(editingItem.cost)}
                              onChange={(event) => handleEditChange('cost', parseCurrencyInput(event.target.value))}
                            />
                            <Input
                              inputMode="numeric"
                              value={formatCurrency(editingItem.salePrice)}
                              onChange={(event) => handleEditChange('salePrice', parseCurrencyInput(event.target.value))}
                            />
                          </div>
                        ) : (
                          formatCurrency(item.salePrice)
                        )}
                      </TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {editingItem?.id === item.id ? (
                            <>
                              <Button size="icon" disabled={updateMutation.isPending} onClick={handleSaveEdit} aria-label={`Salvar edição do item ${item.internalCode}`}>
                                <Save className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                disabled={updateMutation.isPending}
                                onClick={() => setEditingItem(null)}
                                aria-label={`Cancelar edição do item ${item.internalCode}`}
                              >
                                <X className="size-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="icon"
                              variant="outline"
                              disabled={updateMutation.isPending}
                              onClick={() => setEditingItem(toEditForm(item))}
                              aria-label={`Editar item ${item.internalCode}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}
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
