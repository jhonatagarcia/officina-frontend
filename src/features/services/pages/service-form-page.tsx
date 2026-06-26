import { Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  TextAreaField,
  TextField,
  SelectField,
} from '@/components/shared/form-fields';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useServiceForm } from '@/features/services/hooks/use-service-form';
import { formatCurrency, parseCurrencyInput } from '@/lib/utils';

const billingTypeOptions = [
  { label: 'Apenas mão de obra', value: 'LABOR_ONLY' },
  { label: 'Peças e mão de obra', value: 'PARTS_AND_LABOR' },
  { label: 'Preço fixo', value: 'FIXED_PRICE' },
];

const materialSourceOptions = [
  { label: 'Materiais da oficina', value: 'SHOP_SUPPLIES' },
  { label: 'Materiais do cliente', value: 'CUSTOMER_SUPPLIES' },
  { label: 'Sem peças necessárias', value: 'NO_PARTS_REQUIRED' },
  { label: 'Flexível', value: 'FLEXIBLE' },
];

export function ServiceFormPage({
  mode,
}: {
  mode: 'create' | 'edit' | 'view';
}) {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const isReadOnly = mode === 'view';
  const { query, form, mutation } = useServiceForm(mode, id, () =>
    navigate('/inicio/servicos'),
  );

  const laborPrice = form.watch('laborPrice') || 0;
  const suggestedTotalPrice = laborPrice;
  const availableBillingTypeOptions =
    mode === 'create'
      ? billingTypeOptions.filter((option) => option.value !== 'FIXED_PRICE')
      : billingTypeOptions;
  const availableMaterialSourceOptions =
    mode === 'create'
      ? materialSourceOptions.filter(
          (option) =>
            option.value !== 'FLEXIBLE' && option.value !== 'NO_PARTS_REQUIRED',
        )
      : materialSourceOptions;

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title={
          mode === 'create'
            ? 'Novo serviço'
            : mode === 'edit'
              ? 'Editar serviço'
              : 'Detalhes do serviço'
        }
        description="Cadastro padronizado para uso em orçamento e ordem de serviço."
      >
        <Button
          className="min-h-11 rounded-xl font-semibold"
          variant="outline"
          onClick={() => navigate('/inicio/servicos')}
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
          <FormSectionHeader eyebrow="Catálogo" title="Dados do serviço" />
          {mode !== 'create' ? (
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input id="code" disabled value={query.data?.code ?? ''} />
            </div>
          ) : null}
          <TextField
            control={form.control}
            name="name"
            label="Nome do serviço"
            disabled={isReadOnly}
            error={form.formState.errors.name?.message}
          />
          <TextField
            control={form.control}
            name="category"
            label="Categoria"
            disabled={isReadOnly}
            error={form.formState.errors.category?.message}
          />
          <SelectField
            control={form.control}
            name="billingType"
            label="Tipo de cobrança"
            disabled={isReadOnly}
            options={availableBillingTypeOptions}
            error={form.formState.errors.billingType?.message}
          />
          <SelectField
            control={form.control}
            name="materialSource"
            label="Origem do material"
            disabled={isReadOnly}
            options={availableMaterialSourceOptions}
            error={form.formState.errors.materialSource?.message}
          />
          <div className="space-y-2">
            <Label htmlFor="laborPrice">Valor da mão de obra</Label>
            <Input
              id="laborPrice"
              disabled={isReadOnly}
              inputMode="numeric"
              value={formatCurrency(form.watch('laborPrice') ?? 0)}
              onChange={(event) =>
                form.setValue(
                  'laborPrice',
                  parseCurrencyInput(event.target.value),
                  { shouldValidate: true, shouldDirty: true },
                )
              }
            />
            {form.formState.errors.laborPrice?.message ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.laborPrice.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="suggestedTotalPrice">Total sugerido</Label>
            <Input
              id="suggestedTotalPrice"
              disabled
              value={formatCurrency(suggestedTotalPrice)}
            />
          </div>
          <TextField
            control={form.control}
            name="warrantyDays"
            label="Garantia em dias"
            type="number"
            disabled={isReadOnly}
            error={form.formState.errors.warrantyDays?.message}
          />
          <Controller
            control={form.control}
            name="active"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  disabled={isReadOnly || mode === 'create'}
                  onValueChange={(value) => field.onChange(value === 'true')}
                  value={field.value ? 'true' : 'false'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          />
          <div className="md:col-span-2">
            <TextAreaField
              control={form.control}
              name="description"
              label="Descrição"
              disabled={isReadOnly}
              error={form.formState.errors.description?.message}
            />
          </div>
          <div className="md:col-span-2">
            <TextAreaField
              control={form.control}
              name="internalNotes"
              label="Observações internas"
              disabled={isReadOnly}
              error={form.formState.errors.internalNotes?.message}
            />
          </div>
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
