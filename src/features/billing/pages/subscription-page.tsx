import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BadgeCheck,
  CalendarClock,
  CreditCard,
  Info,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { billingService } from '@/features/billing/services/billing-service';
import type {
  BillingSubscriptionStatus,
  BillingType,
} from '@/features/billing/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusLabels: Record<BillingSubscriptionStatus, string> = {
  TRIALING: 'Período gratuito',
  ACTIVE: 'Ativa',
  PAST_DUE: 'Pagamento pendente',
  SUSPENDED: 'Suspensa',
  CANCELED: 'Cancelada',
  EXPIRED: 'Período gratuito encerrado',
  PILOT: 'Oficina piloto',
  LEGACY_FREE: 'Acesso legado',
};

function statusVariant(status: BillingSubscriptionStatus) {
  if (['ACTIVE', 'PILOT', 'LEGACY_FREE'].includes(status)) return 'success';
  if (['TRIALING', 'PAST_DUE'].includes(status)) return 'warning';
  return 'danger';
}

function SubscriptionDate({ status, trialEndsAt, currentPeriodEnd, graceEndsAt }: {
  status: BillingSubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  graceEndsAt: string | null;
}) {
  if (status === 'TRIALING' && trialEndsAt) {
    return <span>Período gratuito até {formatDate(trialEndsAt)}</span>;
  }
  if (status === 'PAST_DUE' && graceEndsAt) {
    return <span>Regularize até {formatDate(graceEndsAt)}</span>;
  }
  if (currentPeriodEnd) {
    return <span>Acesso vigente até {formatDate(currentPeriodEnd)}</span>;
  }
  return <span>Sem data de renovação definida</span>;
}

export function SubscriptionPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const plansQuery = useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: billingService.listPlans,
  });
  const subscriptionQuery = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: billingService.getSubscription,
    refetchInterval:
      searchParams.get('checkout') === 'success' ? 4_000 : false,
  });
  const checkoutMutation = useMutation({
    mutationFn: ({ billingType, planCode }: {
      billingType: BillingType;
      planCode: string;
    }) => billingService.createCheckout(billingType, planCode),
    onSuccess: (checkout) => {
      window.location.assign(checkout.link);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? 'Não foi possível iniciar o pagamento.');
    },
  });

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (!checkout) return;

    if (checkout === 'success') {
      toast.info(
        'Pagamento recebido pelo Asaas. A confirmação do acesso ocorrerá após o webhook seguro.',
      );
      void queryClient.invalidateQueries({
        queryKey: ['billing', 'subscription'],
      });
    } else if (checkout === 'cancel') {
      toast.info('Checkout cancelado. Nenhuma cobrança foi confirmada.');
    } else if (checkout === 'expired') {
      toast.error('O checkout expirou. Gere uma nova cobrança para continuar.');
    }
    setSearchParams({}, { replace: true });
  }, [queryClient, searchParams, setSearchParams]);

  if (plansQuery.isLoading || subscriptionQuery.isLoading) {
    return <LoadingState />;
  }
  if (plansQuery.isError || subscriptionQuery.isError) {
    return (
      <ErrorState
        description="Não foi possível carregar os dados da assinatura."
        onRetry={() => {
          void plansQuery.refetch();
          void subscriptionQuery.refetch();
        }}
      />
    );
  }

  const subscription = subscriptionQuery.data;
  const plan = plansQuery.data?.[0];
  const monthlyPrice = plan?.prices.find((price) => price.cycle === 'MONTHLY');
  const exempt =
    subscription?.status === 'PILOT' ||
    subscription?.status === 'LEGACY_FREE';

  return (
    <PageContainer>
      <PageHeader
        title="Assinatura"
        description="Gerencie o acesso mensal da sua oficina com pagamento processado pelo Asaas."
      />

      {subscription ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Estado atual</CardTitle>
              <CardDescription className="mt-2 flex items-center gap-2">
                <CalendarClock className="size-4" />
                <SubscriptionDate
                  status={subscription.status}
                  trialEndsAt={subscription.trialEndsAt}
                  currentPeriodEnd={subscription.currentPeriodEnd}
                  graceEndsAt={subscription.graceEndsAt}
                />
              </CardDescription>
            </div>
            <Badge variant={statusVariant(subscription.status)}>
              {statusLabels[subscription.status]}
            </Badge>
          </CardHeader>
          {!subscription.billingEnabled ? (
            <CardContent>
              <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">
                A cobrança está desativada neste ambiente. Nenhum pagamento pode
                ser iniciado.
              </p>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      {plan && monthlyPrice ? (
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader className="border-b border-border-soft bg-muted/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-xl">Plano {plan.name}</CardTitle>
                <CardDescription className="mt-2">
                  {plan.description}
                </CardDescription>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl font-bold">
                  {formatCurrency(monthlyPrice.amount)}
                </p>
                <p className="text-sm text-muted-foreground">por mês</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2 font-semibold">
                <CreditCard className="size-5 text-primary" />
                Cartão de crédito
              </div>
              <p className="mt-2 min-h-12 text-sm text-muted-foreground">
                Renovação mensal automática pelo checkout seguro do Asaas.
              </p>
              <Button
                className="mt-4 w-full rounded-xl"
                disabled={
                  exempt ||
                  !subscription?.billingEnabled ||
                  checkoutMutation.isPending
                }
                onClick={() =>
                  checkoutMutation.mutate({
                    billingType: 'CREDIT_CARD',
                    planCode: plan.code,
                  })
                }
              >
                Assinar com cartão
              </Button>
            </div>

            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2 font-semibold">
                <QrCode className="size-5 text-primary" />
                Pix
              </div>
              <p className="mt-2 min-h-12 text-sm text-muted-foreground">
                Pagamento avulso de um mês. Para continuar, será necessário
                renovar manualmente no próximo período.
              </p>
              <Button
                className="mt-4 w-full rounded-xl"
                variant="outline"
                disabled={
                  exempt ||
                  !subscription?.billingEnabled ||
                  checkoutMutation.isPending
                }
                onClick={() =>
                  checkoutMutation.mutate({
                    billingType: 'PIX',
                    planCode: plan.code,
                  })
                }
              >
                Pagar um mês com Pix
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="flat">
          <CardContent className="pt-5">
            <ShieldCheck className="size-5 text-emerald-500" />
            <p className="mt-3 font-semibold">Checkout protegido</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Os dados de pagamento são informados diretamente no ambiente do
              Asaas e não são armazenados pelo AutoPro.
            </p>
          </CardContent>
        </Card>
        <Card variant="flat">
          <CardContent className="pt-5">
            <BadgeCheck className="size-5 text-blue-500" />
            <p className="mt-3 font-semibold">Confirmação por webhook</p>
            <p className="mt-1 text-sm text-muted-foreground">
              O acesso só muda após a confirmação autenticada do provedor, mesmo
              que o navegador retorne como sucesso.
            </p>
          </CardContent>
        </Card>
        <Card variant="flat">
          <CardContent className="pt-5">
            <Info className="size-5 text-amber-500" />
            <p className="mt-3 font-semibold">Ambiente identificado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {subscription?.environment === 'SANDBOX'
                ? 'Sandbox: pagamentos são apenas simulações de homologação.'
                : 'Produção: cobranças reais podem ser processadas.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
