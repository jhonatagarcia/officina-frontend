import { useNavigate } from 'react-router-dom';
import { TextField } from '@/components/shared/form-fields';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInventoryForm } from '@/features/inventory/hooks/use-inventory-form';

export function InventoryFormPage() {
  const navigate = useNavigate();
  const { form, mutation } = useInventoryForm(() => navigate('/app/estoque'));

  return (
    <PageContainer>
      <PageHeader title="Nova peça" description="Cadastre itens de estoque para alimentar a base da oficina." />
      <Card>
        <CardContent className="p-6">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <TextField control={form.control} name="name" label="Nome da peça" error={form.formState.errors.name?.message} />
            <TextField
              control={form.control}
              name="internalCode"
              label="Código interno"
              error={form.formState.errors.internalCode?.message}
            />
            <TextField control={form.control} name="category" label="Categoria" error={form.formState.errors.category?.message} />
            <TextField control={form.control} name="supplier" label="Fornecedor" error={form.formState.errors.supplier?.message} />
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
            <TextField control={form.control} name="cost" label="Custo" type="number" error={form.formState.errors.cost?.message} />
            <TextField
              control={form.control}
              name="salePrice"
              label="Preço de venda"
              type="number"
              error={form.formState.errors.salePrice?.message}
            />
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
