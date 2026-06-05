import type { UseFormReturn } from 'react-hook-form';
import { TextField } from '@/components/shared/form-fields';
import {
  FormActions,
  FormSectionHeader,
  formPrimaryButtonClassName,
} from '@/components/shared/form-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { InventoryItemSchema } from '@/features/inventory/schemas/inventory-item-schema';
import { formatCurrency, parseCurrencyInput } from '@/lib/utils';

interface InventoryItemFormProps {
  form: UseFormReturn<InventoryItemSchema>;
  mode: 'create' | 'edit';
  internalCode: string;
  isPending: boolean;
  onSubmit: (values: InventoryItemSchema) => void;
}

function capitalizeWords(value: string) {
  return value.replace(
    /(^|[\s'-])(\p{L})/gu,
    (_, separator: string, letter: string) =>
      `${separator}${letter.toLocaleUpperCase('pt-BR')}`,
  );
}

export function InventoryItemForm({
  form,
  mode,
  internalCode,
  isPending,
  onSubmit,
}: InventoryItemFormProps) {
  const cost = form.watch('cost') ?? 0;
  const salePrice = form.watch('salePrice') ?? 0;

  return (
    <form
      className="grid gap-5 md:grid-cols-2"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FormSectionHeader eyebrow="Estoque" title="Dados da peça / produto" />
      {mode === 'edit' ? (
        <div className="space-y-2">
          <Label htmlFor="internalCode">ID</Label>
          <Input id="internalCode" disabled value={internalCode} />
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
        {form.formState.errors.cost?.message ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.cost.message}
          </p>
        ) : null}
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
          <p className="text-xs text-destructive">
            {form.formState.errors.salePrice.message}
          </p>
        ) : null}
      </div>
      <FormActions>
        <Button className={formPrimaryButtonClassName} disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </FormActions>
    </form>
  );
}
