import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BudgetItemsEditor } from '@/features/budgets/components/budget-items-editor';
import { BudgetSummaryCard } from '@/features/budgets/components/budget-summary-card';
import { useBudgetForm } from '@/features/budgets/hooks/use-budget-form';
import { useClientOptions } from '@/features/reference-data/hooks/use-client-options';
import { useVehicleOptions } from '@/features/reference-data/hooks/use-vehicle-options';
import { SelectField, TextAreaField } from '@/components/shared/form-fields';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import {
  FormActions,
  FormCard,
  FormSectionHeader,
  formPrimaryButtonClassName,
} from '@/components/shared/form-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Option } from '@/types/common';
import {
  capitalizeFirstLetter,
  formatCurrency,
  parseCurrencyInput,
} from '@/lib/utils';

interface VehicleOption extends Option {
  clientId: string;
}

export function BudgetFormPage({ mode }: { mode: 'create' | 'edit' | 'view' }) {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const clientOptionsQuery = useClientOptions();
  const vehicleOptionsQuery = useVehicleOptions();
  const { budgetQuery, form, fieldArray, mutation, items, discount, total } =
    useBudgetForm(mode, id, () => navigate('/app/orcamentos'));
  const isReadOnly =
    mode === 'view' ||
    (mode === 'edit' &&
      Boolean(budgetQuery.data) &&
      ((!budgetQuery.data?.serviceOrder && budgetQuery.data?.status === 'REPROVADO') ||
        budgetQuery.data?.serviceOrder?.status === 'ENTREGUE'));
  const requiresNewApproval =
    mode === 'edit' &&
    budgetQuery.data?.status === 'APROVADO' &&
    !budgetQuery.data?.serviceOrder;
  const selectedClientId = form.watch('clientId');
  const selectedVehicleId = form.watch('vehicleId');
  const vehicleOptions = (
    (vehicleOptionsQuery.data as VehicleOption[] | undefined) ?? []
  ).filter((vehicle) => vehicle.clientId === selectedClientId);

  useEffect(() => {
    if (!selectedVehicleId) return;

    const vehicleBelongsToClient = vehicleOptions.some(
      (vehicle) => vehicle.value === selectedVehicleId,
    );
    if (!vehicleBelongsToClient) {
      form.setValue('vehicleId', '');
    }
  }, [form, selectedVehicleId, vehicleOptions]);

  if (
    clientOptionsQuery.isLoading ||
    vehicleOptionsQuery.isLoading ||
    budgetQuery.isLoading
  )
    return <LoadingState />;
  if (
    clientOptionsQuery.isError ||
    vehicleOptionsQuery.isError ||
    budgetQuery.isError
  ) {
    return (
      <ErrorState
        onRetry={() => {
          clientOptionsQuery.refetch();
          vehicleOptionsQuery.refetch();
          budgetQuery.refetch();
        }}
      />
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={
          mode === 'create'
            ? 'Novo orçamento'
            : mode === 'edit'
              ? 'Editar orçamento'
              : 'Detalhes do orçamento'
        }
      >
        <Button
          className="min-h-11 rounded-xl bg-white/90 font-semibold"
          variant="outline"
          onClick={() => navigate('/app/orcamentos')}
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Voltar
        </Button>
      </PageHeader>
      {requiresNewApproval ? (
        <div
          aria-live="polite"
          className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800"
        >
          Este orçamento já foi aprovado. Ao salvar qualquer alteração, ele retornará para pendente e
          precisará de nova aprovação antes de ser convertido em OS.
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <FormCard>
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <FormSectionHeader
              eyebrow="Orçamento"
              title="Cliente e veículo"
              className="md:col-span-1"
            />
            <div className="grid gap-5 md:grid-cols-2">
              <SelectField
                control={form.control}
                name="clientId"
                disabled={isReadOnly}
                label="Cliente"
                options={clientOptionsQuery.data ?? []}
                searchable
                searchPlaceholder="Buscar cliente por nome"
                error={form.formState.errors.clientId?.message}
              />
              <SelectField
                control={form.control}
                name="vehicleId"
                disabled={isReadOnly || !selectedClientId}
                label="Veículo"
                options={vehicleOptions}
                error={form.formState.errors.vehicleId?.message}
              />
            </div>
            <div className="grid gap-5 border-t border-border-soft pt-6">
              <TextAreaField
                control={form.control}
                name="problemDescription"
                disabled={isReadOnly}
                label="Problema relatado"
                error={form.formState.errors.problemDescription?.message}
                transformValue={capitalizeFirstLetter}
              />
              <TextAreaField
                control={form.control}
                name="notes"
                disabled={isReadOnly}
                label="Observações"
                error={form.formState.errors.notes?.message}
                transformValue={capitalizeFirstLetter}
              />
            </div>
            <BudgetItemsEditor
              fieldArray={fieldArray}
              form={form}
              items={items}
              readOnly={isReadOnly}
            />
            <div className="max-w-sm space-y-2 border-t border-border-soft pt-6">
              <Label htmlFor="discount">Desconto</Label>
              <Input
                id="discount"
                disabled={isReadOnly}
                inputMode="numeric"
                value={formatCurrency(form.watch('discount') ?? 0)}
                onChange={(event) =>
                  form.setValue(
                    'discount',
                    parseCurrencyInput(event.target.value),
                    { shouldValidate: true },
                  )
                }
              />
              {form.formState.errors.discount?.message ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.discount.message}
                </p>
              ) : null}
            </div>
            {!isReadOnly ? (
              <FormActions>
                <Button
                  className={formPrimaryButtonClassName}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Salvando...' : 'Salvar orçamento'}
                </Button>
              </FormActions>
            ) : null}
          </form>
        </FormCard>
        <BudgetSummaryCard
          discount={discount}
          itemsCount={items.length}
          total={total}
        />
      </div>
    </PageContainer>
  );
}
