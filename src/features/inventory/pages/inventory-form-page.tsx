import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField } from '@/components/shared/form-fields';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInventoryForm } from '@/features/inventory/hooks/use-inventory-form';
import { inventoryService } from '@/features/inventory/services/inventory-service';
import { formatCurrency, formatDateOnly, formatServiceOrderNumber, parseCurrencyInput } from '@/lib/utils';
import type { InventoryItemSchema } from '@/features/inventory/schemas/inventory-item-schema';

function capitalizeWords(value: string) {
  return value.replace(/(^|[\s'-])(\p{L})/gu, (_, separator: string, letter: string) => `${separator}${letter.toLocaleUpperCase('pt-BR')}`);
}

export function InventoryFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const { query, form, mutation } = useInventoryForm(mode, id, () => navigate('/app/estoque'));
  const [pendingValues, setPendingValues] = useState<InventoryItemSchema | null>(null);
  const cost = form.watch('cost') ?? 0;
  const salePrice = form.watch('salePrice') ?? 0;
  const movementsQuery = useQuery({
    queryKey: ['estoque-item', id, 'movements'],
    queryFn: () => inventoryService.getMovements(id),
    enabled: mode === 'edit' && Boolean(pendingValues),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  function handleSubmit(values: InventoryItemSchema) {
    if (mode === 'edit' && query.data && values.quantity !== query.data.quantity) {
      setPendingValues(values);
      return;
    }

    mutation.mutate(values);
  }

  function handleConfirmQuantityChange() {
    if (!pendingValues) return;

    mutation.mutate(pendingValues);
    setPendingValues(null);
  }

  const quantityDelta = pendingValues && query.data ? pendingValues.quantity - query.data.quantity : 0;

  return (
    <PageContainer>
      <PageHeader
        title={mode === 'create' ? 'Nova peça' : 'Editar peça / Produto'}
        description={mode === 'create' ? 'Cadastre itens de estoque para alimentar a base da oficina.' : 'Atualize os dados do item de estoque.'}
      />
      <Card>
        <CardContent className="p-6">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(handleSubmit)}>
            {mode === 'edit' ? (
              <div className="space-y-2">
                <Label htmlFor="internalCode">ID</Label>
                <Input id="internalCode" disabled value={query.data?.internalCode ?? ''} />
              </div>
            ) : null}
            <TextField
              control={form.control}
              name="name"
              label="Nome da peça / Produto"
              error={form.formState.errors.name?.message}
              transformValue={capitalizeWords}
            />
            <TextField
              control={form.control}
              name="category"
              label="Categoria"
              error={form.formState.errors.category?.message}
              transformValue={capitalizeWords}
            />
            <TextField
              control={form.control}
              name="supplier"
              label="Fornecedor"
              error={form.formState.errors.supplier?.message}
              transformValue={capitalizeWords}
            />
            <TextField
              control={form.control}
              name="quantity"
              label="Quantidade atual"
              type="number"
              error={form.formState.errors.quantity?.message}
            />
            <TextField
              control={form.control}
              name="minimumQuantity"
              label="Estoque mínimo"
              type="number"
              error={form.formState.errors.minimumQuantity?.message}
            />
            <div className="space-y-2">
              <Label htmlFor="cost">Custo</Label>
              <Input
                id="cost"
                inputMode="numeric"
                value={formatCurrency(cost)}
                onChange={(event) =>
                  form.setValue('cost', parseCurrencyInput(event.target.value), {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
              {form.formState.errors.cost?.message ? <p className="text-xs text-destructive">{form.formState.errors.cost.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Preço de venda</Label>
              <Input
                id="salePrice"
                inputMode="numeric"
                value={formatCurrency(salePrice)}
                onChange={(event) =>
                  form.setValue('salePrice', parseCurrencyInput(event.target.value), {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
              {form.formState.errors.salePrice?.message ? (
                <p className="text-xs text-destructive">{form.formState.errors.salePrice.message}</p>
              ) : null}
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => navigate('/app/estoque')}>
                Voltar
              </Button>
              <Button disabled={mutation.isPending}>{mutation.isPending ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {pendingValues && query.data ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-panel">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Confirmar alteração manual de estoque</h2>
              <p className="text-sm text-muted-foreground">
                A quantidade atual deste produto será alterada manualmente. Confirme apenas se esta correção não representa uma peça usada em OS.
              </p>
            </div>

            <div className="mt-5 grid gap-3 rounded-xl border bg-secondary/40 p-4 text-sm md:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Quantidade atual</p>
                <p className="text-lg font-semibold">{query.data.quantity}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nova quantidade</p>
                <p className="text-lg font-semibold">{pendingValues.quantity}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Diferença</p>
                <p className={quantityDelta < 0 ? 'text-lg font-semibold text-rose-600' : 'text-lg font-semibold text-emerald-600'}>
                  {quantityDelta > 0 ? '+' : ''}{quantityDelta}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold">Últimas movimentações deste produto</h3>
              <div className="mt-3 max-h-64 overflow-auto rounded-xl border">
                {movementsQuery.isLoading ? (
                  <div className="p-4 text-sm text-muted-foreground">Carregando movimentações...</div>
                ) : movementsQuery.data?.length ? (
                  <div className="divide-y">
                    {movementsQuery.data.map((movement) => (
                      <div key={movement.id} className="grid gap-2 p-3 text-sm md:grid-cols-[1fr_auto]">
                        <div>
                          <p className="font-medium">
                            {movement.type === 'OUT' ? 'Saída por OS' : 'Ajuste manual'} · {movement.quantityChange}
                          </p>
                          <p className="text-muted-foreground">
                            {movement.serviceOrder
                              ? `${formatServiceOrderNumber(movement.serviceOrder.orderNumber)} · ${movement.serviceOrder.client.name}`
                              : movement.reason ?? 'Sem vínculo com OS'}
                          </p>
                        </div>
                        <div className="text-left md:text-right">
                          <p>{formatDateOnly(movement.createdAt)}</p>
                          <p className="text-muted-foreground">{movement.totalCost !== null ? formatCurrency(movement.totalCost) : '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-sm text-muted-foreground">Nenhuma movimentação registrada para este produto.</div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => setPendingValues(null)}>
                Cancelar
              </Button>
              <Button type="button" disabled={mutation.isPending} onClick={handleConfirmQuantityChange}>
                Confirmar alteração
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}
