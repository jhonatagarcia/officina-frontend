import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Edit3, FileDown, Info, Package, Play, Plus, Printer, Share2, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { mechanicsService } from '@/features/mechanics/services/mechanics-service';
import { serviceOrdersService } from '@/features/service-orders/services/service-orders-service';
import type { ServiceOrder, ServiceOrderStatus } from '@/features/service-orders/types';
import { getServiceOrderLaborItems } from '@/features/service-orders/lib/service-order-details';
import { generateServiceOrderPdf } from '@/features/service-orders/lib/service-order-pdf';
import { getAppliedServiceOrderParts } from '@/features/service-orders/lib/service-order-parts';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { PlateChip } from '@/components/shared/table-identity-cells';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, formatCurrency, formatDateOnly, formatPhone, formatServiceOrderNumber } from '@/lib/utils';

function getStatusLabel(status: ServiceOrderStatus) {
  const labels = {
    ABERTA: 'Aberta',
    AGUARDANDO_PECA: 'Aguardando peça',
    EM_ANDAMENTO: 'Em andamento',
    FINALIZADA: 'Concluída',
    ENTREGUE: 'Entregue',
  };
  return labels[status];
}

function getStatusTone(status: ServiceOrderStatus) {
  if (status === 'ABERTA') return 'stone';
  if (status === 'AGUARDANDO_PECA') return 'amber';
  if (status === 'EM_ANDAMENTO') return 'orange';
  if (status === 'FINALIZADA') return 'emerald';
  return 'sky';
}

function getTimelineToneClasses(status: ServiceOrderStatus) {
  const tone = getStatusTone(status);
  return {
    bg: cn(
      tone === 'amber' && 'bg-amber-500',
      tone === 'stone' && 'bg-stone-400',
      tone === 'orange' && 'bg-orange-500',
      tone === 'emerald' && 'bg-emerald-500',
      tone === 'sky' && 'bg-sky-500',
    ),
    border: cn(
      tone === 'amber' && 'border-amber-500',
      tone === 'stone' && 'border-stone-400',
      tone === 'orange' && 'border-orange-500',
      tone === 'emerald' && 'border-emerald-500',
      tone === 'sky' && 'border-sky-500',
    ),
    ring: cn(
      tone === 'amber' && 'ring-amber-500/15',
      tone === 'stone' && 'ring-stone-400/15',
      tone === 'orange' && 'ring-orange-500/15',
      tone === 'emerald' && 'ring-emerald-500/15',
      tone === 'sky' && 'ring-sky-500/15',
    ),
  };
}

function StatusPill({ status }: { status: ServiceOrderStatus }) {
  const tone = getStatusTone(status);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold',
        tone === 'amber' && 'bg-amber-50 text-amber-700',
        tone === 'stone' && 'bg-stone-100 text-stone-700',
        tone === 'orange' && 'bg-orange-50 text-orange-700',
        tone === 'emerald' && 'bg-emerald-50 text-emerald-700',
        tone === 'sky' && 'bg-sky-50 text-sky-700',
      )}
    >
      <span
        className={cn(
          'size-2 rounded-full',
          tone === 'amber' && 'bg-amber-500',
          tone === 'stone' && 'bg-stone-400',
          tone === 'orange' && 'bg-orange-500',
          tone === 'emerald' && 'bg-emerald-500',
          tone === 'sky' && 'bg-sky-500',
        )}
      />
      {getStatusLabel(status)}
    </span>
  );
}

function getInitials(name?: string | null) {
  if (!name) return '-';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getProgressSteps(order: ServiceOrder) {
  const orderIndex = {
    ABERTA: 0,
    AGUARDANDO_PECA: 1,
    EM_ANDAMENTO: 2,
    FINALIZADA: 3,
    ENTREGUE: 4,
  }[order.status];

  return [
    { status: 'ABERTA' as const, title: 'OS aberta', detail: `${formatDateOnly(order.openedAt)} · Atendente`, note: null },
    { status: 'AGUARDANDO_PECA' as const, title: 'Aguardando peça', detail: `${formatDateOnly(order.openedAt)} · Mecânico`, note: 'Peça solicitada ao fornecedor.' },
    { status: 'EM_ANDAMENTO' as const, title: 'Em andamento', detail: order.status === 'EM_ANDAMENTO' ? `${formatDateOnly(order.updatedAt)} · Mecânico` : 'Início do serviço.', note: 'Peça recebida. Início do serviço.' },
    { status: 'FINALIZADA' as const, title: 'Concluída', detail: order.finishedAt ? formatDateOnly(order.finishedAt) : order.expectedDeliveryAt ? `Previsão ${formatDateOnly(order.expectedDeliveryAt)}` : '-', note: null },
    { status: 'ENTREGUE' as const, title: 'Entregue ao cliente', detail: order.deliveredAt ? formatDateOnly(order.deliveredAt) : '-', note: null },
  ].map((step, index) => ({
    ...step,
    state: index < orderIndex ? 'done' : index === orderIndex ? 'current' : 'pending',
  }));
}

export function ServiceOrderDetailsPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [nextStatus, setNextStatus] = useState<ServiceOrderStatus | ''>('');
  const [selectedMechanicId, setSelectedMechanicId] = useState('NONE');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['ordem-servico', id], queryFn: () => serviceOrdersService.getById(id) });
  const mechanicsQuery = useQuery({
    queryKey: ['mecanicos', 'options', 'active'],
    queryFn: () => mechanicsService.list({ page: 1, pageSize: 100, active: true }),
  });
  const mutation = useMutation({
    mutationFn: (status: Parameters<typeof serviceOrdersService.updateStatus>[1]) => serviceOrdersService.updateStatus(id, status),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setNextStatus('');
      toast.success('Status atualizado com sucesso.');
      if (updatedOrder.whatsappNotification?.status === 'SENT') {
        toast.success('Notificação enviada pelo WhatsApp.');
      }
      if (updatedOrder.whatsappNotification?.status === 'SKIPPED') {
        toast.warning(updatedOrder.whatsappNotification.reason || 'WhatsApp não enviado: backend marcou a notificação como ignorada.');
      }
      if (updatedOrder.whatsappNotification?.status === 'FAILED') {
        toast.error(updatedOrder.whatsappNotification.reason || 'Status atualizado, mas não foi possível enviar a mensagem no WhatsApp.');
      }

      query.refetch();
    },
    onError: (error: { message?: string | string[] }) => {
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      toast.error(message || 'Não foi possível atualizar o status da ordem de serviço.');
    },
  });
  const mechanicMutation = useMutation({
    mutationFn: (mechanicId: string) =>
      serviceOrdersService.update(id, {
        mechanicId: mechanicId === 'NONE' ? null : mechanicId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Mecânico responsável atualizado.');
      query.refetch();
    },
    onError: (error: { message?: string | string[] }) => {
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      toast.error(message || 'Não foi possível atualizar o mecânico responsável.');
    },
  });

  useEffect(() => {
    setSelectedMechanicId(query.data?.mechanicId ?? 'NONE');
  }, [query.data?.mechanicId]);

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  const budgetLaborItems = getServiceOrderLaborItems(query.data);
  const appliedParts = getAppliedServiceOrderParts(query.data);
  const canGeneratePdf = query.data.status === 'ENTREGUE';
  const hasMechanicChanged = selectedMechanicId !== (query.data.mechanicId ?? 'NONE');
  const selectedMechanic = mechanicsQuery.data?.data.find((mechanic) => mechanic.id === selectedMechanicId);
  const activeMechanicName = selectedMechanic?.name ?? query.data.mechanicName;
  const activityItems = [
    activeMechanicName
      ? [activeMechanicName, `Mecânico responsável pela OS: ${activeMechanicName}.`, query.data.updatedAt]
      : ['Sistema', 'OS sem mecânico responsável definido.', query.data.updatedAt],
    ['Sistema', `Status atual: ${getStatusLabel(query.data.status)}.`, query.data.updatedAt],
    [query.data.clientName, 'OS aberta. Veículo recebido para avaliação.', query.data.openedAt],
  ];

  const handleGeneratePdf = async () => {
    if (!canGeneratePdf) {
      toast.error('O PDF só pode ser gerado quando a ordem de serviço estiver entregue.');
      return;
    }

    setIsGeneratingPdf(true);

    try {
      await generateServiceOrderPdf({
        order: query.data,
        laborItems: budgetLaborItems,
        appliedParts,
      });
      toast.success('PDF gerado com sucesso.');
    } catch {
      toast.error('Não foi possível gerar o PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleUpdateStatus = () => {
    if (!nextStatus || nextStatus === query.data.status) {
      return;
    }
    mutation.mutate(nextStatus);
  };

  return (
    <PageContainer>
      <PageHeader title="Detalhe da OS" description="Acompanhamento completo da ordem de serviço.">
        <Button className="min-h-11 rounded-xl bg-white/90 font-semibold" variant="outline" onClick={() => navigate('/app/ordens-servico')}>
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Voltar
        </Button>
        <Button className="min-h-11 rounded-xl bg-white/90 font-semibold" variant="outline">
          <Share2 className="size-4" strokeWidth={1.75} />
          Compartilhar
        </Button>
      </PageHeader>

      <Card className="bg-white shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">Ordem de Serviço</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="font-mono text-3xl font-bold tracking-tight">{formatServiceOrderNumber(query.data.orderNumber)}</h2>
                <StatusPill status={query.data.status} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Aberta em <span className="font-bold text-foreground">{formatDateOnly(query.data.openedAt)}</span>
                {query.data.expectedDeliveryAt ? (
                  <> · Previsão de entrega <span className="font-bold text-foreground">{formatDateOnly(query.data.expectedDeliveryAt)}</span></>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="rounded-xl bg-white font-semibold" variant="outline" onClick={() => window.print()}>
                <Printer className="size-4" strokeWidth={1.75} />
                Imprimir
              </Button>
              <Button className="rounded-xl bg-white font-semibold" disabled={!canGeneratePdf || isGeneratingPdf} variant="outline" onClick={handleGeneratePdf}>
                <FileDown className="size-4" strokeWidth={1.75} />
                {isGeneratingPdf ? 'Gerando...' : 'Gerar PDF'}
              </Button>
              <Select onValueChange={(value) => setNextStatus(value as ServiceOrderStatus)} value={nextStatus}>
                <SelectTrigger className="h-10 w-[190px] rounded-xl bg-white">
                  <SelectValue placeholder="Novo status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABERTA">Aberta</SelectItem>
                  <SelectItem value="AGUARDANDO_PECA">Aguardando peça</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                  <SelectItem value="FINALIZADA">Concluída</SelectItem>
                  <SelectItem value="ENTREGUE">Entregue</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="rounded-xl bg-[linear-gradient(135deg,#F77139_0%,#E04618_100%)] font-semibold text-white shadow-[0_12px_24px_rgba(224,70,24,0.22)] hover:brightness-105"
                disabled={mutation.isPending || !nextStatus || nextStatus === query.data.status}
                onClick={handleUpdateStatus}
              >
                <Check className="size-4" strokeWidth={1.75} />
                Atualizar status
              </Button>
            </div>
          </div>

          <div className="mt-7 grid gap-5 border-t border-border-soft pt-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="border-border-soft xl:border-r">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Cliente</p>
              <p className="mt-2 text-lg font-bold">{query.data.clientName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatPhone(query.data.client?.phone)}</p>
            </div>
            <div className="border-border-soft xl:border-r">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Veículo</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {query.data.vehicle?.plate ? <PlateChip>{query.data.vehicle.plate}</PlateChip> : null}
                <p className="text-lg font-bold">{query.data.vehicle ? `${query.data.vehicle.brand} ${query.data.vehicle.model}` : query.data.vehicleLabel}</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{query.data.vehicle ? `${query.data.vehicle.year}` : null}</p>
            </div>
            <div className="border-border-soft xl:border-r">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Mecânico responsável</p>
              <div className="mt-2 flex items-start gap-3">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">
                  {getInitials(query.data.mechanicName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold">{query.data.mechanicName ?? '-'}</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Select
                      disabled={mechanicsQuery.isLoading || mechanicMutation.isPending}
                      onValueChange={setSelectedMechanicId}
                      value={selectedMechanicId}
                    >
                      <SelectTrigger className="h-10 min-w-0 rounded-xl bg-white sm:w-[220px]">
                        <SelectValue placeholder="Selecionar mecânico" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Sem mecânico</SelectItem>
                        {mechanicsQuery.data?.data.map((mechanic) => (
                          <SelectItem key={mechanic.id} value={mechanic.id}>
                            {mechanic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      className="h-10 rounded-xl font-semibold"
                      disabled={mechanicMutation.isPending || mechanicsQuery.isLoading || !hasMechanicChanged}
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => mechanicMutation.mutate(selectedMechanicId)}
                    >
                      {mechanicMutation.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Total</p>
              <p className="mt-2 text-3xl font-bold text-primary [font-variant-numeric:tabular-nums]">{formatCurrency(query.data.total ?? 0)}</p>
              <p className="mt-1 text-sm text-muted-foreground">a receber do cliente</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-xs">
        <CardContent className="p-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">Progresso</p>
          <h3 className="mt-1 text-xl font-bold">Status da ordem</h3>
          <div className="mt-8 overflow-x-auto pb-2">
            <div className="relative min-w-[980px]">
              <div className="absolute left-6 right-6 top-6 grid grid-cols-4">
                {getProgressSteps(query.data).slice(0, 4).map((step, index) => {
                  const nextStep = getProgressSteps(query.data)[index + 1];
                  const isActiveSegment = step.state !== 'pending' && nextStep.state !== 'pending';
                  return (
                    <div
                      key={`${step.status}-segment`}
                      className={cn('h-[3px]', isActiveSegment ? getTimelineToneClasses(nextStep.status).bg : 'bg-stone-200')}
                    />
                  );
                })}
              </div>
              <div className="relative grid grid-cols-5 gap-8">
                {getProgressSteps(query.data).map((step) => (
                  <div key={step.status} className="min-w-0">
                    <div
                      className={cn(
                        'mb-5 inline-flex size-12 items-center justify-center rounded-full border-[3px] bg-white',
                        step.state === 'done' && getTimelineToneClasses(step.status).border,
                        step.state === 'done' && getTimelineToneClasses(step.status).bg,
                        step.state === 'done' && 'text-white',
                        step.state === 'current' && getTimelineToneClasses(step.status).border,
                        step.state === 'current' && getTimelineToneClasses(step.status).bg,
                        step.state === 'current' && getTimelineToneClasses(step.status).ring,
                        step.state === 'current' && 'text-white ring-8',
                        step.state === 'pending' && 'border-stone-300 text-muted-foreground',
                      )}
                    >
                      {step.state === 'current' ? <Play className="size-5" /> : step.state === 'done' ? <Check className="size-5" /> : null}
                    </div>
                    <p className={cn('text-base font-bold', step.state === 'pending' && 'text-muted-foreground')}>{step.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.detail}</p>
                    {step.note ? <p className="mt-3 max-w-56 text-sm italic leading-6 text-muted-foreground">{step.note}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="min-h-80 bg-white shadow-xs">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">Diagnóstico</p>
              <CardTitle className="mt-1 text-xl">Problema relatado</CardTitle>
            </div>
            <Button className="text-primary" size="sm" variant="ghost">
              <Edit3 className="size-4" strokeWidth={1.75} />
              Editar
            </Button>
          </CardHeader>
          <CardContent className="space-y-5 text-base leading-7">
            <p>{query.data.problemDescription}</p>
            {query.data.notes ? (
              <div className="rounded-lg border-l-4 border-sky-400 bg-sky-50 p-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sky-700">
                  <Info className="size-4" strokeWidth={1.75} />
                  Observações internas
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{query.data.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-xs">
          <CardHeader>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">Histórico</p>
            <CardTitle className="mt-1 text-xl">Atividade na OS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {activityItems.map(([author, message, date]) => (
              <div key={`${author}-${message}`} className="grid grid-cols-[40px_1fr_auto] gap-3 border-b border-border-soft py-4 last:border-b-0">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">{getInitials(author)}</span>
                <div>
                  <p className="font-bold">{author}</p>
                  <p className="text-sm text-muted-foreground">{message}</p>
                </div>
                <p className="text-xs text-muted-foreground">{formatDateOnly(String(date))}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-xs">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">Itens da OS</p>
            <CardTitle className="mt-1 text-xl">Serviços executados e peças</CardTitle>
          </div>
          <Button className="rounded-xl bg-white font-semibold" variant="outline">
            <Plus className="size-4" strokeWidth={1.75} />
            Adicionar item
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <p className="mb-3 flex items-center gap-2 font-bold"><Wrench className="size-4 text-primary" /> Serviços <span className="rounded-full bg-stone-100 px-2 text-sm text-muted-foreground">{budgetLaborItems.length}</span></p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Garantia</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgetLaborItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold">{item.description}</TableCell>
                    <TableCell>{item.serviceCode ? '90 dias' : '30 dias'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="[font-variant-numeric:tabular-nums]">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(item.totalPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div>
            <p className="mb-3 flex items-center gap-2 font-bold"><Package className="size-4 text-primary" /> Peças aplicadas <span className="rounded-full bg-stone-100 px-2 text-sm text-muted-foreground">{appliedParts.length}</span></p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Peça</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appliedParts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-mono text-sm font-semibold tracking-[0.08em]">{part.inventoryItem.internalCode}</TableCell>
                    <TableCell className="font-bold">{part.inventoryItem.name}</TableCell>
                    <TableCell>{part.quantity}</TableCell>
                    <TableCell className="[font-variant-numeric:tabular-nums]">{formatCurrency(part.unitPrice)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(part.totalPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-xl border p-5 md:p-6">
            <div className="ml-auto max-w-md space-y-4 text-base">
              <div className="flex items-center justify-between gap-8 text-muted-foreground">
                <span>Subtotal serviços</span>
                <span className="[font-variant-numeric:tabular-nums]">{formatCurrency(query.data.laborTotal ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between gap-8 text-muted-foreground">
                <span>Subtotal peças</span>
                <span className="[font-variant-numeric:tabular-nums]">{formatCurrency(query.data.partsTotal ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between gap-8 text-rose-600">
                <span>Desconto</span>
                <span className="[font-variant-numeric:tabular-nums]">- {formatCurrency(query.data.discount ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between gap-8 border-t pt-5 text-2xl font-bold text-foreground">
                <span>Total</span>
                <span className="[font-variant-numeric:tabular-nums]">{formatCurrency(query.data.total ?? 0)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
