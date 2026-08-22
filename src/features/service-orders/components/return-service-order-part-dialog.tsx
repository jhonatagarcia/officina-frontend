import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  ReturnableServiceOrderPartConsumption,
  ServiceOrderPart,
} from '@/features/service-orders/types';

interface ReturnServiceOrderPartDialogProps {
  part: ServiceOrderPart | null;
  consumptions: ReturnableServiceOrderPartConsumption[] | undefined;
  isLoading: boolean;
  isSubmitting: boolean;
  canRemoveLegacy: boolean;
  onCancel: () => void;
  onConfirm: (payload: {
    consumptionMovementId: string;
    quantity: number;
    reason: string;
  }) => void;
  onConfirmLegacyRemoval: () => void;
}

export function ReturnServiceOrderPartDialog({
  part,
  consumptions,
  isLoading,
  isSubmitting,
  canRemoveLegacy,
  onCancel,
  onConfirm,
  onConfirmLegacyRemoval,
}: ReturnServiceOrderPartDialogProps) {
  const [consumptionMovementId, setConsumptionMovementId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const selectedConsumption = consumptions?.find(
    (consumption) => consumption.id === consumptionMovementId,
  );

  useEffect(() => {
    if (!part) return;
    const first = consumptions?.[0];
    setConsumptionMovementId(first?.id ?? '');
    setQuantity(first ? Math.min(1, first.quantityAvailable) : 1);
    setReason('');
  }, [part, consumptions]);

  const canConfirm =
    Boolean(selectedConsumption) &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= (selectedConsumption?.quantityAvailable ?? 0) &&
    reason.trim().length >= 2 &&
    !isSubmitting;

  return (
    <Dialog
      open={Boolean(part)}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onCancel();
      }}
    >
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Remover peça da OS</DialogTitle>
          <DialogDescription>
            Quando houver baixa de estoque, a remoção será registrada como devolução auditável. Ela não altera a comissão quando envolver somente a peça.
          </DialogDescription>
        </DialogHeader>
        {part ? (
          <div className="space-y-4">
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-semibold">{part.inventoryItem.name}</p>
              <p className="text-muted-foreground">{part.inventoryItem.internalCode} · Aplicada: {part.quantity}</p>
            </div>
            <div className="space-y-2">
              <Label>Baixa de origem</Label>
              <Select
                value={consumptionMovementId}
                disabled={isLoading || isSubmitting || !consumptions?.length}
                onValueChange={setConsumptionMovementId}
              >
                <SelectTrigger aria-label="Baixa de origem">
                  <SelectValue placeholder={isLoading ? 'Carregando baixas...' : 'Selecione a baixa'} />
                </SelectTrigger>
                <SelectContent>
                  {consumptions?.map((consumption) => (
                    <SelectItem key={consumption.id} value={consumption.id}>
                      Disponível para devolver: {consumption.quantityAvailable}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isLoading && !consumptions?.length ? (
                <p className="text-sm text-muted-foreground">
                  {canRemoveLegacy
                    ? 'Esta peça não possui baixa auditável. A remoção usará o fluxo legado e devolverá a quantidade ao estoque.'
                    : 'Não há baixa auditável disponível para esta peça.'}
                </p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="service-order-return-quantity">Quantidade</Label>
                <Input
                  id="service-order-return-quantity"
                  type="number"
                  min={1}
                  max={selectedConsumption?.quantityAvailable}
                  value={quantity}
                  disabled={isSubmitting}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-order-return-reason">Motivo</Label>
                <Input
                  id="service-order-return-reason"
                  value={reason}
                  disabled={isSubmitting}
                  onChange={(event) => setReason(event.target.value)}
                />
              </div>
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
            Cancelar
          </Button>
          {!isLoading && !consumptions?.length && canRemoveLegacy ? (
            <Button type="button" disabled={isSubmitting} onClick={onConfirmLegacyRemoval}>
              {isSubmitting ? 'Removendo...' : 'Remover peça'}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!canConfirm}
              onClick={() =>
                onConfirm({
                  consumptionMovementId,
                  quantity,
                  reason: reason.trim(),
                })
              }
            >
              {isSubmitting ? 'Devolvendo...' : 'Confirmar devolução'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
