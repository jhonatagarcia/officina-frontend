import { useEffect, useState } from 'react';
import { useInventoryOptions } from '@/features/reference-data/hooks/use-inventory-options';
import type { CreateServiceOrderPendingPartPayload, ServiceOrderPendingPart } from '@/features/service-orders/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PendingPartDialogProps {
  open: boolean;
  pendingPart?: ServiceOrderPendingPart | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateServiceOrderPendingPartPayload) => void;
}

export function PendingPartDialog({
  open,
  pendingPart,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: PendingPartDialogProps) {
  const inventoryOptionsQuery = useInventoryOptions();
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [quantityRequired, setQuantityRequired] = useState(1);
  const [note, setNote] = useState('');
  const [expectedArrivalAt, setExpectedArrivalAt] = useState('');

  useEffect(() => {
    if (!open) return;

    setInventoryItemId(pendingPart?.inventoryItemId ?? '');
    setQuantityRequired(pendingPart?.quantityRequired ?? 1);
    setNote(pendingPart?.note ?? '');
    setExpectedArrivalAt(pendingPart?.expectedArrivalAt?.slice(0, 10) ?? '');
  }, [open, pendingPart]);

  const selectedItem = inventoryOptionsQuery.data?.find((item) => item.value === inventoryItemId);
  const availableQuantity = selectedItem?.quantity ?? pendingPart?.quantityAvailable ?? 0;
  const selectedItemOutOfStock = Boolean(selectedItem) && availableQuantity <= 0;
  const canSubmit = Boolean(inventoryItemId) && quantityRequired > 0 && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>{pendingPart ? 'Editar peça pendente' : 'Adicionar peça pendente'}</DialogTitle>
          <DialogDescription>
            Informe apenas a peça que está segurando esta OS. Você pode ajustar ou cancelar depois.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[1fr_160px]">
          <div className="space-y-2">
            <Label>Peça do estoque</Label>
            <Select
              disabled={inventoryOptionsQuery.isLoading || isSubmitting}
              value={inventoryItemId}
              onValueChange={setInventoryItemId}
            >
              <SelectTrigger>
                <SelectValue placeholder={inventoryOptionsQuery.isLoading ? 'Carregando peças...' : 'Selecione a peça'} />
              </SelectTrigger>
              <SelectContent>
                {inventoryOptionsQuery.data?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pending-part-quantity">Quantidade necessária</Label>
            <Input
              id="pending-part-quantity"
              min={1}
              type="number"
              value={quantityRequired}
              onChange={(event) => setQuantityRequired(Number(event.target.value))}
            />
          </div>

          <div className="rounded-xl border border-border-soft bg-stone-50 p-4 text-sm md:col-span-2">
            <p className="font-semibold text-muted-foreground">
              Disponível em estoque: <span className="text-lg font-bold text-foreground dark:text-slate-950">{availableQuantity}</span>
            </p>
            {selectedItemOutOfStock ? (
              <p className="mt-3 font-semibold text-red-600 dark:text-red-400">
                Produto não disponível em estoque. Será necessário efetuar a compra do produto.
              </p>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="pending-part-note">Observação opcional</Label>
            <Textarea
              id="pending-part-note"
              placeholder="Ex.: peça encomendada com fornecedor"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="pending-part-arrival">Previsão de chegada opcional</Label>
            <Input
              id="pending-part-arrival"
              type="date"
              value={expectedArrivalAt}
              onChange={(event) => setExpectedArrivalAt(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                inventoryItemId,
                quantityRequired,
                note: note.trim() || null,
                expectedArrivalAt: expectedArrivalAt || null,
              })
            }
          >
            {isSubmitting ? 'Salvando...' : 'Salvar peça'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
