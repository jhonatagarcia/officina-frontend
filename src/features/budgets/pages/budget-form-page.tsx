import { useNavigate, useParams } from 'react-router-dom';
import { BudgetItemsEditor } from '@/features/budgets/components/budget-items-editor';
import { BudgetSummaryCard } from '@/features/budgets/components/budget-summary-card';
import { useBudgetForm } from '@/features/budgets/hooks/use-budget-form';
import { useClientOptions } from '@/features/reference-data/hooks/use-client-options';
import { useVehicleOptions } from '@/features/reference-data/hooks/use-vehicle-options';
import { SelectField, TextAreaField, TextField } from '@/components/shared/form-fields';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function BudgetFormPage({ mode }: { mode: 'create' | 'view' }) {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const clientOptionsQuery = useClientOptions();
  const vehicleOptionsQuery = useVehicleOptions();
  const { budgetQuery, form, fieldArray, mutation, items, discount, total } = useBudgetForm(mode, id, () =>
    navigate('/app/orcamentos'),
  );
  const isReadOnly = mode === 'view';

  if (clientOptionsQuery.isLoading || vehicleOptionsQuery.isLoading || budgetQuery.isLoading) return <LoadingState />;
  if (clientOptionsQuery.isError || vehicleOptionsQuery.isError || budgetQuery.isError) {
    return <ErrorState onRetry={() => budgetQuery.refetch()} />;
  }

  return (
    <PageContainer>
      <PageHeader title={mode === 'create' ? 'Novo orçamento' : 'Detalhes do orçamento'} />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
        <Card>
          <CardContent className="p-6">
            <form className="space-y-6" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  control={form.control}
                  name="clientId"
                  disabled={isReadOnly}
                  label="Cliente"
                  options={clientOptionsQuery.data ?? []}
                  error={form.formState.errors.clientId?.message}
                />
                <SelectField
                  control={form.control}
                  name="vehicleId"
                  disabled={isReadOnly}
                  label="Veículo"
                  options={vehicleOptionsQuery.data ?? []}
                  error={form.formState.errors.vehicleId?.message}
                />
              </div>
              <TextAreaField
                control={form.control}
                name="problemDescription"
                disabled={isReadOnly}
                label="Problema relatado"
                error={form.formState.errors.problemDescription?.message}
              />
              <TextAreaField control={form.control} name="notes" disabled={isReadOnly} label="Observações" error={form.formState.errors.notes?.message} />
              <BudgetItemsEditor fieldArray={fieldArray} form={form} items={items} readOnly={isReadOnly} />
              <TextField
                control={form.control}
                name="discount"
                disabled={isReadOnly}
                label="Desconto"
                type="number"
                error={form.formState.errors.discount?.message}
              />
              {!isReadOnly ? <Button disabled={mutation.isPending}>{mutation.isPending ? 'Salvando...' : 'Salvar orçamento'}</Button> : null}
            </form>
          </CardContent>
        </Card>
        <BudgetSummaryCard discount={discount} itemsCount={items.length} total={total} />
      </div>
    </PageContainer>
  );
}
