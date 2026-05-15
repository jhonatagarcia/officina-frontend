import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkshopFiscalStatus } from '@/features/workshop/hooks/use-workshop-fiscal-status';
import { workshopService } from '@/features/workshop/services/workshop-service';
import { useWorkshopProfile } from '@/features/workshop/hooks/use-workshop-profile';

function onlyDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, 14);
}

export function WorkshopProfilePage() {
  const queryClient = useQueryClient();
  const fiscalStatus = useWorkshopFiscalStatus();
  const workshopQuery = useWorkshopProfile();
  const [tradeName, setTradeName] = useState(workshopQuery.data?.tradeName ?? '');
  const [cnpj, setCnpj] = useState(fiscalStatus.cnpj ?? '');
  const mutation = useMutation({
    mutationFn: workshopService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['workshop', 'profile'] });
      toast.success('CNPJ da oficina atualizado.');
    },
    onError: () => {
      toast.error('Não foi possível atualizar o CNPJ agora.');
    },
  });
  const normalizedCnpj = onlyDigits(cnpj);
  const canSubmit = tradeName.trim().length >= 2 && (normalizedCnpj.length === 0 || normalizedCnpj.length === 14) && !mutation.isPending;

  useEffect(() => {
    if (workshopQuery.data?.tradeName) setTradeName(workshopQuery.data.tradeName);
    if (workshopQuery.data?.cnpj) setCnpj(workshopQuery.data.cnpj);
  }, [workshopQuery.data]);

  return (
    <PageContainer>
      <PageHeader title="Cadastro da oficina" description="Mantenha os dados fiscais da oficina atualizados para liberar recursos financeiros e fiscais." />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Dados fiscais</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (!canSubmit) return;
                mutation.mutate({ tradeName: tradeName.trim(), cnpj: normalizedCnpj || null });
              }}
            >
              <div className="max-w-md space-y-2">
                <Label htmlFor="workshop-trade-name">Nome fantasia</Label>
                <Input
                  id="workshop-trade-name"
                  placeholder="Ex.: Oficina Avenida"
                  value={tradeName}
                  onChange={(event) => setTradeName(event.target.value)}
                />
              </div>
              <div className="max-w-md space-y-2">
                <Label htmlFor="workshop-cnpj">CNPJ da oficina</Label>
                <Input
                  id="workshop-cnpj"
                  inputMode="numeric"
                  placeholder="Digite os 14 números do CNPJ"
                  value={cnpj}
                  onChange={(event) => setCnpj(onlyDigits(event.target.value))}
                  aria-describedby="workshop-cnpj-help"
                />
                <p id="workshop-cnpj-help" className="text-sm text-muted-foreground">
                  Informe apenas números. Este dado libera funcionalidades que dependem de identificação fiscal.
                </p>
              </div>
              <Button type="submit" disabled={!canSubmit}>
                {mutation.isPending ? 'Salvando...' : 'Salvar CNPJ'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className={fiscalStatus.isIncomplete ? 'border-amber-200 bg-amber-50/60' : 'border-emerald-200 bg-emerald-50/60'}>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              {fiscalStatus.isIncomplete ? (
                <AlertCircle className="mt-0.5 size-5 text-amber-600" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" aria-hidden="true" />
              )}
              <div>
                <p className="font-semibold">{fiscalStatus.isIncomplete ? 'Cadastro fiscal incompleto' : 'Cadastro fiscal liberado'}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {fiscalStatus.isIncomplete
                    ? 'Cadastre o CNPJ para liberar funcionalidades fiscais no sistema.'
                    : 'Quando o backend confirmar o CNPJ, os avisos fiscais deixam de aparecer.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
