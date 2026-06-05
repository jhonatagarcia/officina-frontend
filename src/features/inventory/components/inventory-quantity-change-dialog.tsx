import type { UseQueryResult } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import type { InventoryItemSchema } from '@/features/inventory/schemas/inventory-item-schema';
import type { InventoryMovement } from '@/features/inventory/types';
import { formatCurrency, formatDateOnly, formatServiceOrderNumber } from '@/lib/utils';

interface InventoryQuantityChangeDialogProps {
  currentQuantity: number;
  isPending: boolean;
  movementsQuery: UseQueryResult<InventoryMovement[]>;
  pendingValues: InventoryItemSchema;
  onCancel: () => void;
  onConfirm: () => void;
}

export function InventoryQuantityChangeDialog({
  currentQuantity,
  isPending,
  movementsQuery,
  pendingValues,
  onCancel,
  onConfirm,
}: InventoryQuantityChangeDialogProps) {
  const quantityDelta = pendingValues.quantity - currentQuantity;

  return (
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
            <p className="text-lg font-semibold">{currentQuantity}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Nova quantidade</p>
            <p className="text-lg font-semibold">{pendingValues.quantity}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Diferença</p>
            <p className={quantityDelta < 0 ? 'text-lg font-semibold text-rose-600' : 'text-lg font-semibold text-emerald-600'}>
              {quantityDelta > 0 ? '+' : ''}
              {quantityDelta}
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
                      <p className="text-muted-foreground">
                        {movement.totalCost !== null ? formatCurrency(movement.totalCost) : '-'}
                      </p>
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
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" disabled={isPending} onClick={onConfirm}>
            Confirmar alteração
          </Button>
        </div>
      </div>
    </div>
  );
}
