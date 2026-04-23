import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import type { BudgetSchema } from '@/features/budgets/schemas/budget-schema';
import { capitalizeFirstLetter, formatCurrency, parseCurrencyInput } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServiceOptions } from '@/features/reference-data/hooks/use-service-options';

interface ServiceOption {
  value: string;
  label: string;
  code: string;
  description: string;
  suggestedTotalPrice: number;
}

interface BudgetItemsEditorProps {
  form: UseFormReturn<BudgetSchema>;
  fieldArray: UseFieldArrayReturn<BudgetSchema, 'items'>;
  readOnly: boolean;
  items: BudgetSchema['items'];
}

export function BudgetItemsEditor({ form, fieldArray, readOnly, items }: BudgetItemsEditorProps) {
  const serviceOptionsQuery = useServiceOptions();
  const serviceOptions = (serviceOptionsQuery.data ?? []) as ServiceOption[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Itens do orçamento</h2>
        {!readOnly ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => fieldArray.append({ type: 'PART', serviceCatalogItemId: '', serviceCode: '', description: '', quantity: 1, unitPrice: 1 })}
          >
            Adicionar item
          </Button>
        ) : null}
      </div>
      {fieldArray.fields.map((field, index) => (
        <div key={field.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-4">
          {(() => {
            const itemType = form.watch(`items.${index}.type`);
            const selectedServiceId = form.watch(`items.${index}.serviceCatalogItemId`);
            const selectedService = serviceOptions.find((service) => service.value === selectedServiceId);

            return (
              <>
          <div>
            <Label>Tipo</Label>
            <Select
              disabled={readOnly}
              onValueChange={(value) => {
                const nextType = value as 'PART' | 'LABOR';
                form.setValue(`items.${index}.type`, nextType, { shouldValidate: true });

                if (nextType === 'PART') {
                  form.setValue(`items.${index}.serviceCatalogItemId`, '');
                  form.setValue(`items.${index}.serviceCode`, '');
                }
              }}
              value={itemType}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PART">Peça</SelectItem>
                <SelectItem value="LABOR">Mão de obra</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {itemType === 'LABOR' ? (
            <>
              <div className="md:col-span-2">
                <Label>Serviço</Label>
                <Select
                  disabled={readOnly || serviceOptionsQuery.isLoading}
                  onValueChange={(value) => {
                    const service = serviceOptions.find((option) => option.value === value);
                    form.setValue(`items.${index}.serviceCatalogItemId`, value, { shouldValidate: true });
                    form.setValue(`items.${index}.serviceCode`, service?.code ?? '');
                    form.setValue(`items.${index}.description`, service?.description ?? '', { shouldValidate: true });
                    form.setValue(`items.${index}.unitPrice`, service?.suggestedTotalPrice ?? 0, { shouldValidate: true });
                  }}
                  value={selectedServiceId}
                >
                  <SelectTrigger>
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
                  <p className="text-xs text-destructive">{form.formState.errors.items[index]?.serviceCatalogItemId?.message}</p>
                ) : null}
              </div>
              <div>
                <Label>Código</Label>
                <Input disabled value={form.watch(`items.${index}.serviceCode`) || selectedService?.code || ''} />
              </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <Label>Descrição</Label>
              <Input
                disabled={readOnly}
                value={form.watch(`items.${index}.description`)}
                onChange={(event) =>
                  form.setValue(`items.${index}.description`, capitalizeFirstLetter(event.target.value), { shouldValidate: true })
                }
              />
            </div>
          )}
          <div>
            <Label>Quantidade</Label>
            <Input disabled={readOnly} type="number" min="1" {...form.register(`items.${index}.quantity`)} />
          </div>
          <div>
            <Label>Valor unitário</Label>
            <Input
              disabled={readOnly}
              inputMode="numeric"
              value={formatCurrency(form.watch(`items.${index}.unitPrice`) ?? 0)}
              onChange={(event) =>
                form.setValue(`items.${index}.unitPrice`, parseCurrencyInput(event.target.value), { shouldValidate: true })
              }
            />
          </div>
          <div className="flex items-end">
            <p className="text-sm text-muted-foreground">Subtotal: {formatCurrency(items[index].quantity * items[index].unitPrice)}</p>
          </div>
          {!readOnly ? (
            <div className="flex items-end justify-end md:col-span-2">
              <Button type="button" variant="ghost" onClick={() => fieldArray.remove(index)}>
                Remover
              </Button>
            </div>
          ) : null}
              </>
            );
          })()}
        </div>
      ))}
    </div>
  );
}
