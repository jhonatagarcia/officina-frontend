import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useClientOptions } from '@/features/reference-data/hooks/use-client-options';
import { useVehicleForm } from '@/features/vehicles/hooks/use-vehicle-form';
import {
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/shared/form-fields';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import {
  FormActions,
  FormCard,
  FormSectionHeader,
  formPrimaryButtonClassName,
} from '@/components/shared/form-layout';
import { Button } from '@/components/ui/button';
import { capitalizeFirstLetter, formatPlate } from '@/lib/utils';

export function VehicleFormPage({
  mode,
}: {
  mode: 'create' | 'edit' | 'view';
}) {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const isReadOnly = mode === 'view';
  const clientOptionsQuery = useClientOptions();
  const { query, form, mutation } = useVehicleForm(mode, id, () =>
    navigate('/app/veiculos'),
  );

  if (query.isLoading || clientOptionsQuery.isLoading) return <LoadingState />;
  if (query.isError || clientOptionsQuery.isError) {
    return (
      <ErrorState
        onRetry={() => {
          query.refetch();
          clientOptionsQuery.refetch();
        }}
      />
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={
          mode === 'create'
            ? 'Novo veículo'
            : mode === 'edit'
              ? 'Editar veículo'
              : 'Detalhes do veículo'
        }
      >
        <Button
          className="min-h-11 rounded-xl font-semibold"
          variant="outline"
          onClick={() => navigate('/app/veiculos')}
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Voltar
        </Button>
      </PageHeader>
      <FormCard>
        <form
          className="grid gap-5 md:grid-cols-2"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <FormSectionHeader eyebrow="Cadastro" title="Dados do veículo" />
          <fieldset className="contents" disabled={isReadOnly}>
            <SelectField
              control={form.control}
              name="clientId"
              label="Cliente vinculado"
              options={clientOptionsQuery.data ?? []}
              searchable
              searchPlaceholder="Buscar cliente por nome"
              error={form.formState.errors.clientId?.message}
            />
            <TextField
              control={form.control}
              name="plate"
              label="Placa"
              error={form.formState.errors.plate?.message}
              transformValue={formatPlate}
            />
            <TextField
              control={form.control}
              name="brand"
              label="Marca"
              error={form.formState.errors.brand?.message}
              transformValue={capitalizeFirstLetter}
            />
            <TextField
              control={form.control}
              name="model"
              label="Modelo"
              error={form.formState.errors.model?.message}
              transformValue={capitalizeFirstLetter}
            />
            <TextField
              control={form.control}
              name="year"
              label="Ano"
              error={form.formState.errors.year?.message}
            />
            <TextField
              control={form.control}
              name="color"
              label="Cor"
              error={form.formState.errors.color?.message}
              transformValue={capitalizeFirstLetter}
            />
            <TextField
              control={form.control}
              name="mileage"
              label="Quilometragem"
              error={form.formState.errors.mileage?.message}
            />
            <TextField
              control={form.control}
              name="fuel"
              label="Combustível"
              error={form.formState.errors.fuel?.message}
              transformValue={capitalizeFirstLetter}
            />
            <div className="md:col-span-2">
              <TextAreaField
                control={form.control}
                name="notes"
                label="Observações"
                error={form.formState.errors.notes?.message}
                transformValue={capitalizeFirstLetter}
              />
            </div>
          </fieldset>
          <FormActions>
            {!isReadOnly ? (
              <Button
                className={formPrimaryButtonClassName}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            ) : null}
          </FormActions>
        </form>
      </FormCard>
    </PageContainer>
  );
}
