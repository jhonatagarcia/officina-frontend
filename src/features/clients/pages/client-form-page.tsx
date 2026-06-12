import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useClientForm } from '@/features/clients/hooks/use-client-form';
import { TextAreaField, TextField } from '@/components/shared/form-fields';
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
import { capitalizeFirstLetter, formatCpfCnpj, formatPhone } from '@/lib/utils';

export function ClientFormPage({ mode }: { mode: 'create' | 'edit' | 'view' }) {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const isReadOnly = mode === 'view';
  const { query, form, mutation } = useClientForm(mode, id, () =>
    navigate('/app/clientes'),
  );

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title={
          mode === 'create'
            ? 'Novo cliente'
            : mode === 'edit'
              ? 'Editar cliente'
              : 'Detalhes do cliente'
        }
        description="Dados cadastrais e observações do cliente."
      >
        <Button
          className="min-h-11 rounded-xl font-semibold"
          variant="outline"
          onClick={() => navigate('/app/clientes')}
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
          <FormSectionHeader eyebrow="Cadastro" title="Dados do cliente" />
          <fieldset className="contents" disabled={isReadOnly}>
            <TextField
              control={form.control}
              name="name"
              label="Nome"
              error={form.formState.errors.name?.message}
              transformValue={capitalizeFirstLetter}
            />
            <TextField
              control={form.control}
              name="phone"
              label="Celular"
              error={form.formState.errors.phone?.message}
              inputMode="numeric"
              transformValue={formatPhone}
            />
            <TextField
              control={form.control}
              name="document"
              label="CPF/CNPJ"
              error={form.formState.errors.document?.message}
              inputMode="numeric"
              transformValue={formatCpfCnpj}
            />
            <TextField
              control={form.control}
              name="email"
              label="E-mail"
              error={form.formState.errors.email?.message}
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
