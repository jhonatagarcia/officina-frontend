import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Info } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import {
  FormActions,
  FormCard,
  FormSectionHeader,
  formPrimaryButtonClassName,
} from '@/components/shared/form-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkshopFiscalStatus } from '@/features/workshop/hooks/use-workshop-fiscal-status';
import {
  workshopService,
  type WorkshopProfile,
} from '@/features/workshop/services/workshop-service';
import { useWorkshopProfile } from '@/features/workshop/hooks/use-workshop-profile';
import { onlyDigits } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  if (!digits) return '';

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function WorkshopProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);
  const fiscalStatus = useWorkshopFiscalStatus();
  const workshopQuery = useWorkshopProfile();
  const [tradeName, setTradeName] = useState(
    workshopQuery.data?.tradeName ?? '',
  );
  const [cnpj, setCnpj] = useState(formatCnpj(fiscalStatus.cnpj ?? ''));
  const mutation = useMutation({
    mutationFn: workshopService.updateProfile,
    onSuccess: (updatedProfile, values) => {
      const localProfile = {
        ...updatedProfile,
        tradeName: values.tradeName,
        cnpj: values.cnpj ?? null,
      };
      queryClient.setQueryData<WorkshopProfile>(
        ['workshop', 'profile'],
        localProfile,
      );
      if (session) {
        const previousWorkshopName =
          session.user.workshop?.tradeName ?? session.user.workshop?.name;
        const shouldSyncUserName = previousWorkshopName
          ? session.user.name === previousWorkshopName
          : false;

        setSession({
          ...session,
          user: {
            ...session.user,
            name: shouldSyncUserName
              ? localProfile.tradeName
              : session.user.name,
            workshop: {
              ...session.user.workshop,
              id: localProfile.id,
              name: localProfile.tradeName,
              tradeName: localProfile.tradeName,
              cnpj: localProfile.cnpj,
              fiscalStatus: localProfile.fiscalProfile.status,
              fiscalRegistrationComplete:
                localProfile.fiscalProfile.status === 'COMPLETE',
            },
            workshopFiscalStatus: localProfile.fiscalProfile.status,
          },
        });
      }
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('Cadastro do negócio atualizado.');
    },
    onError: () => {
      toast.error('Não foi possível atualizar o cadastro agora.');
    },
  });
  const normalizedCnpj = onlyDigits(cnpj);
  const canSubmit =
    tradeName.trim().length >= 2 &&
    (normalizedCnpj.length === 0 || normalizedCnpj.length === 14) &&
    !mutation.isPending;

  useEffect(() => {
    if (workshopQuery.data?.tradeName)
      setTradeName(workshopQuery.data.tradeName);
    if (workshopQuery.data?.cnpj) setCnpj(formatCnpj(workshopQuery.data.cnpj));
  }, [workshopQuery.data]);

  return (
    <PageContainer>
      <PageHeader
        title="Cadastro do negócio"
        description="Mantenha os dados cadastrais do negócio atualizados. O CNPJ é opcional e não condiciona recursos operacionais ou financeiros."
      >
        <Button
          className="min-h-11 rounded-xl font-semibold"
          variant="outline"
          onClick={() => navigate('/inicio/dashboard')}
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Voltar
        </Button>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <FormCard>
          <form
            className="grid gap-5 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!canSubmit) return;
              mutation.mutate({
                tradeName: tradeName.trim(),
                cnpj: normalizedCnpj || null,
              });
            }}
          >
            <FormSectionHeader eyebrow="Meu Negócio" title="Dados cadastrais" />
            <div className="space-y-2">
              <Label htmlFor="workshop-trade-name">Nome fantasia</Label>
              <Input
                id="workshop-trade-name"
                placeholder="Ex.: Meu Negócio Avenida"
                value={tradeName}
                onChange={(event) => setTradeName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workshop-cnpj">CNPJ do negócio</Label>
              <Input
                id="workshop-cnpj"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(event) => setCnpj(formatCnpj(event.target.value))}
                aria-describedby="workshop-cnpj-help"
              />
              <p
                id="workshop-cnpj-help"
                className="text-sm text-muted-foreground"
              >
                Se informado, use um CNPJ válido. O financeiro não depende deste
                dado, que também não habilita emissão fiscal.
              </p>
            </div>
            <FormActions>
              <Button
                className={formPrimaryButtonClassName}
                type="submit"
                disabled={!canSubmit}
              >
                {mutation.isPending ? 'Salvando...' : 'Salvar cadastro'}
              </Button>
            </FormActions>
          </form>
        </FormCard>
        <Card
          className={
            fiscalStatus.isIncomplete
              ? 'border-amber-500/20 bg-amber-500/10'
              : 'border-emerald-500/20 bg-emerald-500/10'
          }
        >
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              {fiscalStatus.hasCnpj ? (
                <CheckCircle2
                  className="mt-0.5 size-5 text-emerald-500"
                  aria-hidden="true"
                />
              ) : (
                <Info
                  className="mt-0.5 size-5 text-amber-500"
                  aria-hidden="true"
                />
              )}
              <div>
                <p className="font-semibold text-foreground">
                  {fiscalStatus.hasCnpj ? 'CNPJ cadastrado' : 'CNPJ opcional'}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Financeiro, estoque, orçamentos e ordens de serviço permanecem
                  disponíveis sem CNPJ. Emissão fiscal não está disponível nesta
                  versão.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
