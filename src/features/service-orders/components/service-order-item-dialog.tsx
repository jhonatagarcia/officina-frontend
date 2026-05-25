import { useEffect, useState } from 'react';
import { useInventoryOptions } from '@/features/reference-data/hooks/use-inventory-options';
import { useServiceOptions } from '@/features/reference-data/hooks/use-service-options';
import type { ServiceOrderBudgetItem, UpdateServiceOrderItemPayload } from '@/features/service-orders/types';
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

type EditableServiceOrderItemType = ServiceOrderBudgetItem['type'];

interface ServiceOrderItemDialogProps {
  item: ServiceOrderBudgetItem | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: UpdateServiceOrderItemPayload) => void;
}

export function ServiceOrderItemDialog({
  item,
  isSubmitting,
  onCancel,
  onSubmit,
}: ServiceOrderItemDialogProps) {
  const serviceOptionsQuery = useServiceOptions();
  const inventoryOptionsQuery = useInventoryOptions();
  const [type, setType] = useState<EditableServiceOrderItemType>('LABOR');
  const [serviceCatalogItemId, setServiceCatalogItemId] = useState('');
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  useEffect(() => {
    if (!item) return;
    setType(item.type);
    setServiceCatalogItemId(item.serviceCatalogItemId ?? '');
    setInventoryItemId(item.inventoryItemId ?? '');
    setDescription(item.description);
    setQuantity(item.quantity);
    setUnitPrice(item.unitPrice);
  }, [item]);

  if (!item) return null;

  const includesService = type === 'LABOR' || type === 'LABOR_AND_PART';
  const includesInventory = type === 'PART' || type === 'LABOR_AND_PART';
  const selectedService = serviceOptionsQuery.data?.find((option) => option.value === serviceCatalogItemId);
  const selectedInventoryItem = inventoryOptionsQuery.data?.find((option) => option.value === inventoryItemId);
  const canSubmit =
    quantity > 0 &&
    unitPrice >= 0 &&
    (!includesService || Boolean(serviceCatalogItemId)) &&
    (!includesInventory || Boolean(inventoryItemId)) &&
    !isSubmitting;

  const syncCompositeDescriptionAndPrice = (nextServiceId: string, nextInventoryId: string) => {
    const service = serviceOptionsQuery.data?.find((option) => option.value === nextServiceId);
    const inventory = inventoryOptionsQuery.data?.find((option) => option.value === nextInventoryId);
    setDescription([service?.description, inventory?.name].filter(Boolean).join(' + '));
    setUnitPrice((service?.suggestedTotalPrice ?? 0) + (inventory?.salePrice ?? 0));
  };

  const handleTypeChange = (nextType: EditableServiceOrderItemType) => {
    setType(nextType);

    if (nextType === 'LABOR') {
      setInventoryItemId('');
      setDescription(selectedService?.description ?? description);
      setUnitPrice(selectedService?.suggestedTotalPrice ?? unitPrice);
      return;
    }

    if (nextType === 'LABOR_AND_PART') {
      syncCompositeDescriptionAndPrice(serviceCatalogItemId, inventoryItemId);
      return;
    }

    setServiceCatalogItemId('');
    setDescription(selectedInventoryItem?.name ?? description);
    setUnitPrice(selectedInventoryItem?.salePrice ?? unitPrice);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Editar item da execução</DialogTitle>
          <DialogDescription>Esta alteração atualiza a OS sem modificar o orçamento aprovado.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="service-order-item-type">Tipo</Label>
            <Select
              disabled={isSubmitting}
              value={type}
              onValueChange={(value) => handleTypeChange(value as EditableServiceOrderItemType)}
            >
              <SelectTrigger id="service-order-item-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LABOR">Mão de obra</SelectItem>
                <SelectItem value="LABOR_AND_PART">Mão de obra + peça</SelectItem>
                {item.type === 'PART' ? <SelectItem value="PART">Peça</SelectItem> : null}
              </SelectContent>
            </Select>
          </div>
          {includesService ? (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="service-order-item-service">Serviço</Label>
              <Select
                disabled={serviceOptionsQuery.isLoading || isSubmitting}
                value={serviceCatalogItemId}
                onValueChange={(value) => {
                  setServiceCatalogItemId(value);
                  if (type === 'LABOR_AND_PART') {
                    syncCompositeDescriptionAndPrice(value, inventoryItemId);
                  } else {
                    const service = serviceOptionsQuery.data?.find((option) => option.value === value);
                    setDescription(service?.description ?? '');
                    setUnitPrice(service?.suggestedTotalPrice ?? 0);
                  }
                }}
              >
                <SelectTrigger id="service-order-item-service">
                  <SelectValue placeholder="Selecione um serviço" />
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
          ) : null}
          {includesInventory ? (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="service-order-item-inventory">Peça ou produto</Label>
              <Select
                disabled={inventoryOptionsQuery.isLoading || isSubmitting}
                value={inventoryItemId}
                onValueChange={(value) => {
                  setInventoryItemId(value);
                  if (type === 'LABOR_AND_PART') {
                    syncCompositeDescriptionAndPrice(serviceCatalogItemId, value);
                  } else {
                    const inventory = inventoryOptionsQuery.data?.find((option) => option.value === value);
                    setDescription(inventory?.name ?? '');
                    setUnitPrice(inventory?.salePrice ?? 0);
                  }
                }}
              >
                <SelectTrigger id="service-order-item-inventory">
                  <SelectValue placeholder="Selecione uma peça ou produto" />
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
          ) : null}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="service-order-item-description">Descrição</Label>
            <Input
              id="service-order-item-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-order-item-quantity">Quantidade</Label>
            <Input
              id="service-order-item-quantity"
              min={1}
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-order-item-price">Valor unitário</Label>
            <Input
              id="service-order-item-price"
              inputMode="numeric"
              value={formatCurrency(unitPrice)}
              onChange={(event) => setUnitPrice(parseCurrencyInput(event.target.value))}
            />
          </div>
          <p className="text-sm text-muted-foreground md:col-span-2">
            Total do item: {formatCurrency(quantity * unitPrice)}
            {selectedService?.code ? ` · Serviço ${selectedService.code}` : ''}
            {selectedInventoryItem?.internalCode ? ` · Peça ${selectedInventoryItem.internalCode}` : ''}
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!canSubmit || description.trim().length < 3}
            onClick={() =>
              onSubmit({
                type,
                serviceCatalogItemId: includesService ? serviceCatalogItemId : null,
                inventoryItemId: includesInventory ? inventoryItemId : null,
                description: description.trim(),
                quantity,
                unitPrice,
              })
            }
          >
            {isSubmitting ? 'Salvando...' : 'Salvar item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
