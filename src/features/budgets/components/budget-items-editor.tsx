import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import type { BudgetSchema } from '@/features/budgets/schemas/budget-schema';
import { formatCurrency } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BudgetItemsEditorProps {
  form: UseFormReturn<BudgetSchema>;
  fieldArray: UseFieldArrayReturn<BudgetSchema, 'items'>;
  readOnly: boolean;
  items: BudgetSchema['items'];
}

export function BudgetItemsEditor({ form, fieldArray, readOnly, items }: BudgetItemsEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Itens do orçamento</h2>
        {!readOnly ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => fieldArray.append({ type: 'PART', description: '', quantity: 1, unitPrice: 1 })}
          >
            Adicionar item
          </Button>
        ) : null}
      </div>
      {fieldArray.fields.map((field, index) => (
        <div key={field.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-4">
          <div>
            <Label>Tipo</Label>
            <Select
              disabled={readOnly}
              onValueChange={(value) => form.setValue(`items.${index}.type`, value as 'PART' | 'LABOR')}
              value={form.watch(`items.${index}.type`)}
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
          <div className="md:col-span-2">
            <Label>Descrição</Label>
            <Input disabled={readOnly} {...form.register(`items.${index}.description`)} />
          </div>
          <div>
            <Label>Quantidade</Label>
            <Input disabled={readOnly} type="number" min="1" {...form.register(`items.${index}.quantity`)} />
          </div>
          <div>
            <Label>Valor unitário</Label>
            <Input disabled={readOnly} type="number" min="0" step="0.01" {...form.register(`items.${index}.unitPrice`)} />
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
        </div>
      ))}
    </div>
  );
}
