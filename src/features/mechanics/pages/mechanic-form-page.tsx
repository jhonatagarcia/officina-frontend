import { Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TextField } from '@/components/shared/form-fields';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMechanicForm } from '@/features/mechanics/hooks/use-mechanic-form';
import { capitalizeFirstLetter } from '@/lib/utils';

export function MechanicFormPage({
  mode,
}: {
  mode: 'create' | 'edit' | 'view';
}) {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const isReadOnly = mode === 'view';
  const { query, form, mutation } = useMechanicForm(mode, id, () =>
    navigate('/inicio/mecanicos'),
  );
  const handleSubmit = form.handleSubmit((values) => mutation.mutate(values));

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title={
          mode === 'create'
            ? 'Novo mecânico'
            : mode === 'edit'
              ? 'Editar mecânico'
              : 'Detalhes do mecânico'
        }
      >
        <Button
          className="min-h-11 rounded-xl font-semibold"
          variant="outline"
          onClick={() => navigate('/inicio/mecanicos')}
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Voltar
        </Button>
      </PageHeader>
      <FormCard>
        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <FormSectionHeader eyebrow="Equipe" title="Dados do mecânico" />
          <fieldset className="contents" disabled={isReadOnly}>
            <TextField
              control={form.control}
              name="name"
              label="Nome completo"
              error={form.formState.errors.name?.message}
              transformValue={capitalizeFirstLetter}
            />
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    disabled={isReadOnly || mutation.isPending}
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
