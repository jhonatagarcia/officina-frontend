import { useNavigate } from 'react-router-dom';
import { TextField } from '@/components/shared/form-fields';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInventoryForm } from '@/features/inventory/hooks/use-inventory-form';
import { formatCurrency, parseCurrencyInput } from '@/lib/utils';

function capitalizeWords(value: string) {
  return value.replace(/\b([a-zà-ÿ])/g, (match) => match.toUpperCase());
}

export function InventoryFormPage() {
  const navigate = useNavigate();
  const { form, mutation } = useInventoryForm(() => navigate('/app/estoque'));
  const cost = form.watch('cost') ?? 0;
  const salePrice = form.watch('salePrice') ?? 0;

  return (
    <PageContainer>
      <PageHeader title="Nova peça" description="Cadastre itens de estoque para alimentar a base da oficina." />
      <Card>
        <CardContent className="p-6">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
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
              {form.formState.errors.cost?.message ? <p className="text-xs text-destructive">{form.formState.errors.cost.message}</p> : null}
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
                <p className="text-xs text-destructive">{form.formState.errors.salePrice.message}</p>
              ) : null}
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => navigate('/app/estoque')}>
                Voltar
              </Button>
              <Button disabled={mutation.isPending}>{mutation.isPending ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
