import { useEffect, useState } from 'react';
import { useInventoryOptions } from '@/features/reference-data/hooks/use-inventory-options';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';

interface ServiceOrderStockPartDialogProps {
  open: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { inventoryItemId: string; quantity: number; unitPrice: number }) => void;
}

export function ServiceOrderStockPartDialog({
  open,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: ServiceOrderStockPartDialogProps) {
  const inventoryOptionsQuery = useInventoryOptions();
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!open) return;
    setInventoryItemId('');
    setQuantity(1);
  }, [open]);

  const selectedItem = inventoryOptionsQuery.data?.find((item) => item.value === inventoryItemId);
  const availableQuantity = selectedItem?.quantity ?? 0;
  const unitPrice = selectedItem?.salePrice ?? 0;
  const canSubmit = Boolean(selectedItem) && quantity > 0 && quantity <= availableQuantity && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Aplicar peça do estoque</DialogTitle>
          <DialogDescription>
            Use esta ação quando a peça já estiver disponível. Se não houver estoque suficiente, registre como peça pendente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[1fr_150px]">
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
            <Label htmlFor="stock-part-quantity">Quantidade necessária</Label>
            <Input
              id="stock-part-quantity"
              min={1}
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </div>

          <div className="rounded-xl border border-border-soft bg-stone-50 p-4 text-sm md:col-span-2">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="font-semibold text-muted-foreground">Disponível</p>
                <p className="mt-1 text-lg font-bold">{availableQuantity}</p>
              </div>
              <div>
                <p className="font-semibold text-muted-foreground">Necessária</p>
                <p className="mt-1 text-lg font-bold">{quantity > 0 ? quantity : 0}</p>
              </div>
              <div>
                <p className="font-semibold text-muted-foreground">Valor unitário</p>
                <p className="mt-1 text-lg font-bold">{formatCurrency(unitPrice)}</p>
              </div>
            </div>
            {selectedItem && quantity > availableQuantity ? (
              <p className="mt-3 font-semibold text-amber-700">
                Estoque insuficiente para aplicar esta peça. Cadastre a necessidade como peça pendente.
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => selectedItem && onSubmit({ inventoryItemId, quantity, unitPrice })}
          >
            {isSubmitting ? 'Aplicando...' : 'Aplicar na OS'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
