import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import type { BudgetSchema } from '@/features/budgets/schemas/budget-schema';
import { formatCurrency, parseCurrencyInput } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventoryOptions } from '@/features/reference-data/hooks/use-inventory-options';
import { useServiceOptions } from '@/features/reference-data/hooks/use-service-options';

interface ServiceOption {
  value: string;
  label: string;
  code: string;
  description: string;
  suggestedTotalPrice: number;
}

interface InventoryOption {
  value: string;
  label: string;
  name: string;
  internalCode: string;
  salePrice: number;
}

interface BudgetItemsEditorProps {
  form: UseFormReturn<BudgetSchema>;
  fieldArray: UseFieldArrayReturn<BudgetSchema, 'items'>;
  readOnly: boolean;
  items: BudgetSchema['items'];
}

interface BudgetItemRowProps {
  form: UseFormReturn<BudgetSchema>;
  index: number;
  item: BudgetSchema['items'][number];
  readOnly: boolean;
  serviceOptions: ServiceOption[];
  inventoryOptions: InventoryOption[];
  isLoadingServices: boolean;
  isLoadingInventory: boolean;
  onRemove: () => void;
}

const defaultBudgetItem: BudgetSchema['items'][number] = {
  type: 'LABOR',
  serviceCatalogItemId: '',
  inventoryItemId: '',
  serviceCode: '',
  description: '',
  quantity: 1,
  unitPrice: 1,
};

function BudgetItemRow({
  form,
  index,
  item,
  readOnly,
  serviceOptions,
  inventoryOptions,
  isLoadingServices,
  isLoadingInventory,
  onRemove,
}: BudgetItemRowProps) {
  const typeFieldId = `budget-item-${index}-type`;
  const serviceFieldId = `budget-item-${index}-service`;
  const serviceCodeFieldId = `budget-item-${index}-service-code`;
  const inventoryFieldId = `budget-item-${index}-inventory`;
  const inventoryCodeFieldId = `budget-item-${index}-inventory-code`;
  const quantityFieldId = `budget-item-${index}-quantity`;
  const unitPriceFieldId = `budget-item-${index}-unit-price`;
  const itemType = form.watch(`items.${index}.type`);
  const selectedServiceId = form.watch(`items.${index}.serviceCatalogItemId`);
  const selectedInventoryItemId = form.watch(`items.${index}.inventoryItemId`);
  const selectedService = serviceOptions.find((service) => service.value === selectedServiceId);
  const selectedInventoryItem = inventoryOptions.find((inventoryItem) => inventoryItem.value === selectedInventoryItemId);

  function syncCompositeItem(serviceId: string, inventoryId: string) {
    const service = serviceOptions.find((option) => option.value === serviceId);
    const inventoryItem = inventoryOptions.find((option) => option.value === inventoryId);

    const descriptionParts = [service?.description, inventoryItem?.name].filter(Boolean);
    if (descriptionParts.length) {
      form.setValue(`items.${index}.description`, descriptionParts.join(' + '), { shouldValidate: true });
    }

    const nextUnitPrice = (service?.suggestedTotalPrice ?? 0) + (inventoryItem?.salePrice ?? 0);
    form.setValue(`items.${index}.unitPrice`, nextUnitPrice, { shouldValidate: true });
  }

  function syncPartItem(inventoryId: string) {
    const inventoryItem = inventoryOptions.find((option) => option.value === inventoryId);

    form.setValue(`items.${index}.description`, inventoryItem?.name ?? '', { shouldValidate: true });
    form.setValue(`items.${index}.unitPrice`, inventoryItem?.salePrice ?? 0, { shouldValidate: true });
  }

  return (
    <div className="grid gap-3 rounded-xl border p-4 md:grid-cols-4">
      <div>
        <Label htmlFor={typeFieldId}>Tipo</Label>
        <Select
          disabled={readOnly}
          onValueChange={(value) => {
            const nextType = value as 'LABOR' | 'LABOR_AND_PART';
            form.setValue(`items.${index}.type`, nextType, { shouldValidate: true });

            if (nextType === 'LABOR') {
              form.setValue(`items.${index}.inventoryItemId`, '');
            }
          }}
          value={itemType}
        >
          <SelectTrigger id={typeFieldId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LABOR">Mão de obra</SelectItem>
            <SelectItem value="LABOR_AND_PART">Mão de obra + peça</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {itemType === 'LABOR' || itemType === 'LABOR_AND_PART' ? (
        <>
          <div className="md:col-span-2">
            <Label htmlFor={serviceFieldId}>Serviço</Label>
            <Select
              disabled={readOnly || isLoadingServices}
              onValueChange={(value) => {
                const service = serviceOptions.find((option) => option.value === value);
                form.setValue(`items.${index}.serviceCatalogItemId`, value, { shouldValidate: true });
                form.setValue(`items.${index}.serviceCode`, service?.code ?? '');
                if (itemType === 'LABOR_AND_PART') {
                  syncCompositeItem(value, selectedInventoryItemId ?? '');
                } else {
                  form.setValue(`items.${index}.description`, service?.description ?? '', { shouldValidate: true });
                  form.setValue(`items.${index}.unitPrice`, service?.suggestedTotalPrice ?? 0, {
                    shouldValidate: true,
                  });
                }
              }}
              value={selectedServiceId}
            >
              <SelectTrigger id={serviceFieldId}>
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {serviceOptions.map((service) => (
                  <SelectItem key={service.value} value={service.value}>
                    {service.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.items?.[index]?.serviceCatalogItemId?.message ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.items[index]?.serviceCatalogItemId?.message}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor={serviceCodeFieldId}>Código</Label>
            <Input
              id={serviceCodeFieldId}
              disabled
              value={form.watch(`items.${index}.serviceCode`) || selectedService?.code || ''}
            />
          </div>

          {itemType === 'LABOR_AND_PART' ? (
            <>
              <div className="md:col-span-2">
                <Label htmlFor={inventoryFieldId}>Peça ou produto</Label>
                <Select
                  disabled={readOnly || isLoadingInventory}
                  onValueChange={(value) => {
                    form.setValue(`items.${index}.inventoryItemId`, value, { shouldValidate: true });
                    syncCompositeItem(selectedServiceId ?? '', value);
                  }}
                  value={selectedInventoryItemId}
                >
                  <SelectTrigger id={inventoryFieldId}>
                    <SelectValue placeholder="Selecione uma peça ou produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryOptions.map((inventoryItem) => (
                      <SelectItem key={inventoryItem.value} value={inventoryItem.value}>
                        {inventoryItem.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.items?.[index]?.inventoryItemId?.message ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.items[index]?.inventoryItemId?.message}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor={inventoryCodeFieldId}>Código da peça</Label>
                <Input id={inventoryCodeFieldId} disabled value={selectedInventoryItem?.internalCode ?? ''} />
              </div>
            </>
          ) : null}
        </>
      ) : (
        <>
          <div className="md:col-span-2">
            <Label htmlFor={inventoryFieldId}>Peça ou produto</Label>
            <Select
              disabled={readOnly || isLoadingInventory}
              onValueChange={(value) => {
                form.setValue(`items.${index}.inventoryItemId`, value, { shouldValidate: true });
                syncPartItem(value);
              }}
              value={selectedInventoryItemId}
            >
              <SelectTrigger id={inventoryFieldId}>
                <SelectValue placeholder="Selecione uma peça ou produto" />
              </SelectTrigger>
              <SelectContent>
                {inventoryOptions.map((inventoryItem) => (
                  <SelectItem key={inventoryItem.value} value={inventoryItem.value}>
                    {inventoryItem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.items?.[index]?.inventoryItemId?.message ? (
              <p className="text-xs text-destructive">{form.formState.errors.items[index]?.inventoryItemId?.message}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor={inventoryCodeFieldId}>Código da peça</Label>
            <Input id={inventoryCodeFieldId} disabled value={selectedInventoryItem?.internalCode ?? ''} />
          </div>
        </>
      )}

      <div>
        <Label htmlFor={quantityFieldId}>Quantidade</Label>
        <Input
          id={quantityFieldId}
          disabled={readOnly}
          type="number"
          min="1"
          {...form.register(`items.${index}.quantity`)}
        />
      </div>

      <div>
        <Label htmlFor={unitPriceFieldId}>Valor unitário</Label>
        <Input
          id={unitPriceFieldId}
          disabled={readOnly}
          inputMode="numeric"
          value={formatCurrency(form.watch(`items.${index}.unitPrice`) ?? 0)}
          onChange={(event) =>
            form.setValue(`items.${index}.unitPrice`, parseCurrencyInput(event.target.value), { shouldValidate: true })
          }
        />
      </div>

      <div className="flex items-end">
        <p className="text-sm text-muted-foreground">
          Subtotal: {formatCurrency(item.quantity * item.unitPrice)}
        </p>
      </div>

      {!readOnly ? (
        <div className="flex items-end justify-end md:col-span-2">
          <Button type="button" variant="ghost" onClick={onRemove}>
            Remover
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function BudgetItemsEditor({ form, fieldArray, readOnly, items }: BudgetItemsEditorProps) {
  const serviceOptionsQuery = useServiceOptions();
  const inventoryOptionsQuery = useInventoryOptions();
  const serviceOptions = (serviceOptionsQuery.data ?? []) as ServiceOption[];
  const inventoryOptions = (inventoryOptionsQuery.data ?? []) as InventoryOption[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Itens do orçamento</h2>
        {!readOnly ? (
          <Button type="button" variant="outline" onClick={() => fieldArray.append(defaultBudgetItem)}>
            Adicionar item
          </Button>
        ) : null}
      </div>

      {fieldArray.fields.map((field, index) => (
        <BudgetItemRow
          key={field.id}
          form={form}
          index={index}
          item={items[index]}
          readOnly={readOnly}
          serviceOptions={serviceOptions}
          inventoryOptions={inventoryOptions}
          isLoadingServices={serviceOptionsQuery.isLoading}
          isLoadingInventory={inventoryOptionsQuery.isLoading}
          onRemove={() => fieldArray.remove(index)}
        />
      ))}
    </div>
  );
}
