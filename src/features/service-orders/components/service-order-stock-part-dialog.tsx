import { useEffect, useState } from 'react';
import { useInventoryOptions } from '@/features/reference-data/hooks/use-inventory-options';
import { useServiceOptions } from '@/features/reference-data/hooks/use-service-options';
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
import { formatCurrency, parseCurrencyInput } from '@/lib/utils';
import type { AddServiceOrderServicePayload } from '@/features/service-orders/types';

const NO_INVENTORY_ITEM = 'NONE';

interface ServiceOrderStockPartDialogProps {
  open: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AddServiceOrderServicePayload) => void;
}

export function ServiceOrderStockPartDialog({
  open,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: ServiceOrderStockPartDialogProps) {
  const serviceOptionsQuery = useServiceOptions();
  const inventoryOptionsQuery = useInventoryOptions();
  const [serviceCatalogItemId, setServiceCatalogItemId] = useState('');
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  useEffect(() => {
    if (!open) return;
    setServiceCatalogItemId('');
    setInventoryItemId('');
    setDescription('');
    setQuantity(1);
    setUnitPrice(0);
  }, [open]);

  const selectedService = serviceOptionsQuery.data?.find((item) => item.value === serviceCatalogItemId);
  const selectedItem = inventoryOptionsQuery.data?.find((item) => item.value === inventoryItemId);
  const compositeUnitPrice = unitPrice + (selectedItem?.salePrice ?? 0);
  const canSubmit = Boolean(selectedService) && description.trim().length >= 3 && quantity > 0 && unitPrice >= 0 && !isSubmitting;

  const handleServiceChange = (value: string) => {
    const service = serviceOptionsQuery.data?.find((option) => option.value === value);
    setServiceCatalogItemId(value);
    setDescription(service?.description ?? '');
    setUnitPrice(service?.suggestedTotalPrice ?? 0);
  };

  const handleInventoryChange = (value: string) => {
    if (value === NO_INVENTORY_ITEM) {
      setInventoryItemId('');
      setDescription(selectedService?.description ?? description);
      setUnitPrice(selectedService?.suggestedTotalPrice ?? unitPrice);
      return;
    }

    const inventoryItem = inventoryOptionsQuery.data?.find((option) => option.value === value);
    setInventoryItemId(value);
    const descriptionParts = [selectedService?.description, inventoryItem?.name].filter(Boolean);
    if (descriptionParts.length) {
      setDescription(descriptionParts.join(' + '));
    }
    setUnitPrice(selectedService?.suggestedTotalPrice ?? unitPrice);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar serviço</DialogTitle>
          <DialogDescription>
            Inclua um novo serviço na OS e no orçamento vinculado. A peça de estoque é opcional.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Serviço</Label>
            <Select
              disabled={serviceOptionsQuery.isLoading || isSubmitting}
              value={serviceCatalogItemId}
              onValueChange={handleServiceChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={serviceOptionsQuery.isLoading ? 'Carregando serviços...' : 'Selecione o serviço'} />
              </SelectTrigger>
              <SelectContent>
                {serviceOptionsQuery.data?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Peça vinculada</Label>
            <Select
              disabled={inventoryOptionsQuery.isLoading || isSubmitting}
              value={inventoryItemId || NO_INVENTORY_ITEM}
              onValueChange={handleInventoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={inventoryOptionsQuery.isLoading ? 'Carregando peças...' : 'Nenhuma peça vinculada'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_INVENTORY_ITEM}>Sem peça vinculada</SelectItem>
                {inventoryOptionsQuery.data?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="service-order-new-service-description">Descrição</Label>
            <Input
              id="service-order-new-service-description"
              disabled={isSubmitting}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-order-new-service-quantity">Quantidade</Label>
            <Input
              id="service-order-new-service-quantity"
              min={1}
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-order-new-service-unit-price">Valor unitário do serviço</Label>
            <Input
              id="service-order-new-service-unit-price"
              disabled={isSubmitting}
              inputMode="numeric"
              value={formatCurrency(unitPrice)}
              onChange={(event) => setUnitPrice(parseCurrencyInput(event.target.value))}
            />
          </div>

          <div className="rounded-xl border border-border-soft bg-stone-50 p-4 text-sm md:col-span-2">
            <p className="font-semibold text-muted-foreground">Subtotal</p>
            <p className="mt-1 text-lg font-bold">{formatCurrency(Math.max(quantity, 0) * compositeUnitPrice)}</p>
            {selectedItem ? (
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p>
                  Peça vinculada: <span className="font-semibold text-foreground">{formatCurrency(selectedItem.salePrice)}</span> por unidade.
                </p>
                <p>
                  Estoque atual da peça vinculada: <span className="font-semibold text-foreground">{selectedItem.quantity}</span>
                </p>
              </div>
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
            onClick={() => onSubmit({
              serviceCatalogItemId,
              inventoryItemId: inventoryItemId || null,
              description: description.trim(),
              quantity,
              unitPrice,
            })}
          >
            {isSubmitting ? 'Adicionando...' : 'Adicionar serviço'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
