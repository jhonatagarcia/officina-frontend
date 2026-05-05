import { Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField } from '@/components/shared/form-fields';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMechanicForm } from '@/features/mechanics/hooks/use-mechanic-form';
import { capitalizeFirstLetter } from '@/lib/utils';

export function MechanicFormPage({ mode }: { mode: 'create' | 'edit' | 'view' }) {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const isReadOnly = mode === 'view';
  const { query, form, mutation } = useMechanicForm(mode, id, () => navigate('/app/mecanicos'));
  const handleSubmit = form.handleSubmit((values) => mutation.mutate(values));

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <PageContainer>
      <PageHeader title={mode === 'create' ? 'Novo mecânico' : mode === 'edit' ? 'Editar mecânico' : 'Detalhes do mecânico'} />
      <Card>
        <CardContent className="p-6">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
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
            <div className="md:col-span-2 flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => navigate('/app/mecanicos')}>
                Voltar
              </Button>
              {!isReadOnly ? <Button disabled={mutation.isPending}>{mutation.isPending ? 'Salvando...' : 'Salvar'}</Button> : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
