import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Edit3, FileDown, Info, Package, Play, Plus, Save, Share2, Trash2, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { mechanicsService } from '@/features/mechanics/services/mechanics-service';
import { PendingPartDialog } from '@/features/service-orders/components/pending-part-dialog';
import { PendingPartsCard } from '@/features/service-orders/components/pending-parts-card';
import { RegressiveStatusChangeDialog } from '@/features/service-orders/components/regressive-status-change-dialog';
import { RemoveServiceOrderPartDialog } from '@/features/service-orders/components/remove-service-order-part-dialog';
import { RemoveServiceOrderItemDialog } from '@/features/service-orders/components/remove-service-order-item-dialog';
import { ResumeServiceOrderDialog } from '@/features/service-orders/components/resume-service-order-dialog';
import { ServiceOrderStockPartDialog } from '@/features/service-orders/components/service-order-stock-part-dialog';
import { ServiceOrderItemDialog } from '@/features/service-orders/components/service-order-item-dialog';
import { serviceOrdersService } from '@/features/service-orders/services/service-orders-service';
import type {
  CreateServiceOrderPendingPartPayload,
  AddServiceOrderServicePayload,
  ServiceOrder,
  ServiceOrderPart,
  ServiceOrderPendingPart,
  ServiceOrderBudgetItem,
  ServiceOrderStatus,
  UpdateServiceOrderItemPayload,
} from '@/features/service-orders/types';
import { getEditableServiceOrderItems, getServiceOrderLaborItems } from '@/features/service-orders/lib/service-order-details';
import { generateServiceOrderPdf } from '@/features/service-orders/lib/service-order-pdf';
import {
  getAppliedServiceOrderParts,
  getPlannedServiceOrderParts,
} from '@/features/service-orders/lib/service-order-parts';
import {
  getServiceOrderStatusLabel,
  getServiceOrderStatusTone,
  isRegressiveServiceOrderStatusChange,
  isReadOnlyServiceOrderStatus,
  shouldShowWaitingForPartStep,
} from '@/features/service-orders/lib/service-order-status';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { VehicleIdentityCell } from '@/components/shared/table-identity-cells';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatCurrency, formatDateOnly, formatPhone, formatServiceOrderNumber } from '@/lib/utils';

function getTimelineToneClasses(status: ServiceOrderStatus) {
  const tone = getServiceOrderStatusTone(status);
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
  const tone = getServiceOrderStatusTone(status);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold',
        tone === 'amber' && 'bg-amber-500/10 text-amber-500',
        tone === 'stone' && 'bg-muted text-stone-400',
        tone === 'orange' && 'bg-orange-500/10 text-orange-500',
        tone === 'emerald' && 'bg-emerald-500/10 text-emerald-500',
        tone === 'sky' && 'bg-sky-500/10 text-sky-500',
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
      {getServiceOrderStatusLabel(status)}
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
  const steps = [
    { status: 'ABERTA' as const, title: 'OS aberta', detail: `${formatDateOnly(order.openedAt)} · Atendente`, note: null },
    { status: 'AGUARDANDO_PECA' as const, title: 'Aguardando peça', detail: `${formatDateOnly(order.openedAt)} · Mecânico`, note: 'Peça solicitada ao fornecedor.' },
    { status: 'EM_ANDAMENTO' as const, title: 'Em andamento', detail: order.status === 'EM_ANDAMENTO' ? `${formatDateOnly(order.updatedAt)} · Mecânico` : 'Início do serviço.', note: 'Peça recebida. Início do serviço.' },
    { status: 'FINALIZADA' as const, title: 'Concluída', detail: order.finishedAt ? formatDateOnly(order.finishedAt) : order.expectedDeliveryAt ? `Previsão ${formatDateOnly(order.expectedDeliveryAt)}` : '-', note: null },
    { status: 'ENTREGUE' as const, title: 'Entregue ao cliente', detail: order.deliveredAt ? formatDateOnly(order.deliveredAt) : '-', note: null },
  ].filter((step) => step.status !== 'AGUARDANDO_PECA' || shouldShowWaitingForPartStep(order));
  const orderIndex = Math.max(
    steps.findIndex((step) => step.status === order.status),
    0,
  );

  return steps.map((step, index) => ({
    ...step,
    state: index < orderIndex ? 'done' : index === orderIndex ? 'current' : 'pending',
  }));
}

export function ServiceOrderDetailsPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const pageMode = searchParams.get('mode');
  const isReadOnlyMode = pageMode === 'view' || pageMode === 'print';
  const isPrintMode = pageMode === 'print';
  const [nextStatus, setNextStatus] = useState<ServiceOrderStatus | ''>('');
  const [selectedMechanicId, setSelectedMechanicId] = useState('NONE');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pendingPartDialogOpen, setPendingPartDialogOpen] = useState(false);
  const [stockPartDialogOpen, setStockPartDialogOpen] = useState(false);
  const [stockPartToRemove, setStockPartToRemove] = useState<ServiceOrderPart | null>(null);
  const [executionItemToEdit, setExecutionItemToEdit] = useState<ServiceOrderBudgetItem | null>(null);
  const [executionItemToRemove, setExecutionItemToRemove] = useState<ServiceOrderBudgetItem | null>(null);
  const [pendingPartToEdit, setPendingPartToEdit] = useState<ServiceOrderPendingPart | null>(null);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [regressiveStatusToConfirm, setRegressiveStatusToConfirm] = useState<ServiceOrderStatus | null>(null);
  const [isEditingProblem, setIsEditingProblem] = useState(false);
  const [problemDraft, setProblemDraft] = useState('');
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['ordem-servico', id],
    queryFn: () => serviceOrdersService.getById(id),
    enabled: Boolean(id),
  });
  const isReadOnly = isReadOnlyMode || isReadOnlyServiceOrderStatus(query.data?.status);
  const mechanicsQuery = useQuery({
    queryKey: ['mecanicos', 'options', 'active'],
    queryFn: () => mechanicsService.list({ page: 1, pageSize: 100, active: true }),
  });
  const mutation = useMutation({
    mutationFn: (status: Parameters<typeof serviceOrdersService.updateStatus>[1]) => serviceOrdersService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setNextStatus('');
      setRegressiveStatusToConfirm(null);
      toast.success('Status atualizado com sucesso.');
      /*
       * TODO(WhatsApp Cloud API): restaurar os toasts de envio quando a feature voltar.
       * if (updatedOrder.whatsappNotification?.status === 'SENT') {
       *   toast.success('Notificação enviada pelo WhatsApp.');
       * }
       * if (updatedOrder.whatsappNotification?.status === 'SKIPPED') {
       *   toast.warning(updatedOrder.whatsappNotification.reason || 'WhatsApp não enviado.');
       * }
       * if (updatedOrder.whatsappNotification?.status === 'FAILED') {
       *   toast.error(updatedOrder.whatsappNotification.reason || 'Falha ao enviar WhatsApp.');
       * }
       */

      query.refetch();
    },
    onError: (error: { message?: string | string[] }) => {
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      setNextStatus('');
      setRegressiveStatusToConfirm(null);
      toast.error(message || 'Não foi possível atualizar o status da ordem de serviço.');
    },
  });
  const createPendingPartMutation = useMutation({
    mutationFn: (payload: CreateServiceOrderPendingPartPayload) => serviceOrdersService.createPendingPart(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      setPendingPartDialogOpen(false);
      toast.success('Peça pendente salva.');
    },
    onError: (error: { message?: string | string[] }) => {
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      toast.error(message || 'Não foi possível salvar a peça pendente.');
    },
  });
  const updatePendingPartMutation = useMutation({
    mutationFn: ({ pendingPartId, payload }: { pendingPartId: string; payload: CreateServiceOrderPendingPartPayload }) =>
      serviceOrdersService.updatePendingPart(id, pendingPartId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      setPendingPartDialogOpen(false);
      setPendingPartToEdit(null);
      toast.success('Peça pendente atualizada.');
    },
    onError: (error: { message?: string | string[] }) => {
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      toast.error(message || 'Não foi possível atualizar a peça pendente.');
    },
  });
  const cancelPendingPartMutation = useMutation({
    mutationFn: (pendingPartId: string) => serviceOrdersService.cancelPendingPart(id, pendingPartId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      toast.success('Pendência cancelada.');
    },
    onError: (error: { message?: string | string[] }) => {
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      toast.error(message || 'Não foi possível cancelar a pendência.');
    },
  });
  const addServiceMutation = useMutation({
    mutationFn: (payload: AddServiceOrderServicePayload) =>
      serviceOrdersService.addService(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      if (query.data?.budgetId) {
        queryClient.invalidateQueries({ queryKey: ['orcamento', query.data.budgetId] });
      }
      queryClient.invalidateQueries({ queryKey: ['reference', 'estoque', 'options'] });
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setStockPartDialogOpen(false);
      toast.success('Serviço adicionado à OS e ao orçamento.');
      query.refetch();
    },
    onError: (error: { message?: string | string[] }) => {
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      toast.error(message || 'Não foi possível adicionar o serviço à OS.');
    },
  });
  const removeStockPartMutation = useMutation({
    mutationFn: (partId: string) => serviceOrdersService.removePart(id, partId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      queryClient.invalidateQueries({ queryKey: ['reference', 'estoque', 'options'] });
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setStockPartToRemove(null);
      toast.success('Peça removida da OS e devolvida ao estoque.');
      query.refetch();
    },
    onError: (error: { message?: string | string[] }) => {
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      toast.error(message || 'Não foi possível remover a peça da OS.');
    },
  });
  const updateExecutionItemMutation = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: UpdateServiceOrderItemPayload }) =>
      serviceOrdersService.updateItem(id, itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setExecutionItemToEdit(null);
      toast.success('Item da execução atualizado.');
      query.refetch();
    },
    onError: (error: { message?: string | string[] }) => {
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      toast.error(message || 'Não foi possível atualizar o item da execução.');
    },
  });
  const removeExecutionItemMutation = useMutation({
    mutationFn: (itemId: string) => serviceOrdersService.removeItem(id, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setExecutionItemToRemove(null);
      toast.success('Item excluído da execução da OS.');
      query.refetch();
    },
    onError: (error: { message?: string | string[] }) => {
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      toast.error(message || 'Não foi possível excluir o item da execução.');
    },
  });
  const resumeMutation = useMutation({
    mutationFn: () => serviceOrdersService.resumeAfterPartsArrival(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setResumeDialogOpen(false);
      toast.success('OS retomada com sucesso.');
      /*
       * TODO(WhatsApp Cloud API): restaurar os toasts quando a integracao for reativada.
       * if (updatedOrder.whatsappNotification?.status === 'SENT') {
       *   toast.success('Notificação enviada pelo WhatsApp.');
       * }
       * if (updatedOrder.whatsappNotification?.status === 'FAILED') {
       *   toast.error(updatedOrder.whatsappNotification.reason || 'Falha ao enviar WhatsApp.');
       * }
       */
      query.refetch();
    },
    onError: (error: { message?: string | string[] }) => {
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      toast.error(message || 'Não foi possível retomar a OS.');
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
  const problemMutation = useMutation({
    mutationFn: (problemDescription: string) =>
      serviceOrdersService.update(id, {
        problemDescription,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      setIsEditingProblem(false);
      toast.success('Problema relatado atualizado.');
      query.refetch();
    },
    onError: (error: { message?: string | string[] }) => {
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      toast.error(message || 'Não foi possível atualizar o problema relatado.');
    },
  });

  useEffect(() => {
    setSelectedMechanicId(query.data?.mechanicId ?? 'NONE');
  }, [query.data?.mechanicId]);

  useEffect(() => {
    setProblemDraft(query.data?.problemDescription ?? '');
  }, [query.data?.problemDescription]);

  useEffect(() => {
    if (!isPrintMode || !query.data) return;
    const timeoutId = window.setTimeout(() => window.print(), 250);
    return () => window.clearTimeout(timeoutId);
  }, [isPrintMode, query.data]);

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  const budgetLaborItems = getServiceOrderLaborItems(query.data);
  const editablePlannedItems = getEditableServiceOrderItems(query.data);
  const plannedParts = getPlannedServiceOrderParts(query.data);
  const appliedParts = getAppliedServiceOrderParts(query.data);
  const canManageStockParts =
    !isReadOnly && query.data.status !== 'FINALIZADA' && query.data.status !== 'ENTREGUE';
  const removableStockPartIds = new Set((query.data.parts ?? []).map((part) => part.id));
  const progressSteps = getProgressSteps(query.data);
  const canGeneratePdf = query.data.status === 'ENTREGUE';
  const hasMechanicChanged = selectedMechanicId !== (query.data.mechanicId ?? 'NONE');
  const selectedMechanic = mechanicsQuery.data?.data.find((mechanic) => mechanic.id === selectedMechanicId);
  const activeMechanicName = selectedMechanic?.name ?? query.data.mechanicName;
  const activityItems = [
    activeMechanicName
      ? [activeMechanicName, `Mecânico responsável pela OS: ${activeMechanicName}.`, query.data.updatedAt]
      : ['Sistema', 'OS sem mecânico responsável definido.', query.data.updatedAt],
    ['Sistema', `Status atual: ${getServiceOrderStatusLabel(query.data.status)}.`, query.data.updatedAt],
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
    if (isReadOnly) return;

    if (!nextStatus || nextStatus === query.data.status) {
      return;
    }

    if (nextStatus === 'AGUARDANDO_PECA') {
      setPendingPartToEdit(null);
      setPendingPartDialogOpen(true);
      return;
    }

    if (isRegressiveServiceOrderStatusChange(query.data.status, nextStatus)) {
      setRegressiveStatusToConfirm(nextStatus);
      return;
    }

    mutation.mutate(nextStatus);
  };

  const handleCancelRegressiveStatusChange = () => {
    if (mutation.isPending) return;
    setRegressiveStatusToConfirm(null);
    setNextStatus('');
  };

  const handleConfirmRegressiveStatusChange = () => {
    if (!regressiveStatusToConfirm) return;
    mutation.mutate(regressiveStatusToConfirm);
  };

  const handleOpenPendingPartDialog = (pendingPart?: ServiceOrderPendingPart) => {
    if (isReadOnly) return;
    setPendingPartToEdit(pendingPart ?? null);
    setPendingPartDialogOpen(true);
  };

  const handleSavePendingPart = (payload: CreateServiceOrderPendingPartPayload) => {
    if (isReadOnly) return;

    if (pendingPartToEdit) {
      updatePendingPartMutation.mutate({ pendingPartId: pendingPartToEdit.id, payload });
      return;
    }

    createPendingPartMutation.mutate(payload);
    setNextStatus('');
  };

  const handleSaveProblem = () => {
    if (isReadOnly) return;

    const nextProblemDescription = problemDraft.trim();
    if (!nextProblemDescription) {
      toast.error('Informe o problema relatado.');
      return;
    }
    if (nextProblemDescription === query.data.problemDescription) {
      setIsEditingProblem(false);
      return;
    }
    problemMutation.mutate(nextProblemDescription);
  };

  return (
    <PageContainer>
      <PageHeader
        title={isReadOnly ? 'Visualização da OS' : 'Operação da OS'}
        description={isReadOnly ? 'Consulta da ordem de serviço em modo somente leitura.' : 'Acompanhamento operacional da ordem de serviço.'}
      >
        <Button className="min-h-11 rounded-xl font-semibold" variant="outline" onClick={() => navigate('/inicio/ordens-servico')}>
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Voltar
        </Button>
        {!isReadOnly ? (
          <Button className="min-h-11 rounded-xl font-semibold" variant="outline">
          <Share2 className="size-4" strokeWidth={1.75} />
          Compartilhar
          </Button>
        ) : null}
      </PageHeader>

      <Card className="bg-card shadow-xs">
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
            {!isReadOnly ? (
              <div className="flex flex-wrap gap-2">
              <Button className="rounded-xl font-semibold" disabled={!canGeneratePdf || isGeneratingPdf} variant="outline" onClick={handleGeneratePdf}>
                <FileDown className="size-4" strokeWidth={1.75} />
                {isGeneratingPdf ? 'Gerando...' : 'Gerar PDF'}
              </Button>
              <Select onValueChange={(value) => setNextStatus(value as ServiceOrderStatus)} value={nextStatus}>
                <SelectTrigger aria-label="Novo status da OS" className="h-10 w-[190px] rounded-xl">
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
            ) : null}
          </div>

          <div className="mt-7 grid gap-5 border-t border-border-soft pt-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="border-border-soft xl:border-r">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Cliente</p>
              <p className="mt-2 text-lg font-bold">{query.data.clientName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatPhone(query.data.client?.phone)}</p>
            </div>
            <div className="border-border-soft xl:border-r">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Veículo</p>
              <div className="mt-2">
                <VehicleIdentityCell
                  plate={query.data.vehicle?.plate}
                  description={query.data.vehicle ? `${query.data.vehicle.brand} ${query.data.vehicle.model}` : null}
                  fallback={query.data.vehicleLabel}
                />
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
                  {!isReadOnly ? (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Select
                      disabled={mechanicsQuery.isLoading || mechanicMutation.isPending}
                      onValueChange={setSelectedMechanicId}
                      value={selectedMechanicId}
                    >
                      <SelectTrigger className="h-10 min-w-0 rounded-xl sm:w-[220px]">
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
                  ) : null}
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

      <Card className="bg-card shadow-xs">
        <CardContent className="p-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">Progresso</p>
          <h3 className="mt-1 text-xl font-bold">Status da ordem</h3>
          <div className="mt-8 overflow-x-auto pb-2">
            <div className="relative" style={{ minWidth: `${Math.max(progressSteps.length * 190, 760)}px` }}>
              <div
                className="absolute left-6 right-6 top-6 grid"
                style={{ gridTemplateColumns: `repeat(${Math.max(progressSteps.length - 1, 1)}, minmax(0, 1fr))` }}
              >
                {progressSteps.slice(0, -1).map((step, index) => {
                  const nextStep = progressSteps[index + 1];
                  if (!nextStep) return null;
                  const isActiveSegment = step.state !== 'pending' && nextStep.state !== 'pending';
                  return (
                    <div
                      key={`${step.status}-segment`}
                      className={cn('h-[3px]', isActiveSegment ? getTimelineToneClasses(nextStep.status).bg : 'bg-stone-200')}
                    />
                  );
                })}
              </div>
              <div className="relative grid gap-8" style={{ gridTemplateColumns: `repeat(${progressSteps.length}, minmax(0, 1fr))` }}>
                {progressSteps.map((step) => (
                  <div key={step.status} className="min-w-0">
                    <div
                      className={cn(
                        'mb-5 inline-flex size-12 items-center justify-center rounded-full border-[3px] bg-card',
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

      <PendingPartsCard
        isLoading={query.isLoading}
        isError={query.isError}
        serviceOrderStatus={query.data.status}
        pendingParts={query.data.pendingParts ?? []}
        readOnly={isReadOnly}
        onAdd={() => handleOpenPendingPartDialog()}
        onEdit={handleOpenPendingPartDialog}
        onCancel={(pendingPart) => cancelPendingPartMutation.mutate(pendingPart.id)}
        onResume={() => setResumeDialogOpen(true)}
        onRetry={() => query.refetch()}
      />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="min-h-80 bg-card shadow-xs">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">Diagnóstico</p>
              <CardTitle className="mt-1 text-xl">Problema relatado</CardTitle>
            </div>
            {!isReadOnly && !isEditingProblem ? (
              <Button className="text-primary" size="sm" variant="ghost" onClick={() => setIsEditingProblem(true)}>
                <Edit3 className="size-4" strokeWidth={1.75} />
                Editar
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-5 text-base leading-7">
            {isEditingProblem ? (
              <div className="space-y-3">
                <Textarea
                  aria-label="Problema relatado"
                  value={problemDraft}
                  onChange={(event) => setProblemDraft(event.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="rounded-xl font-semibold"
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setProblemDraft(query.data.problemDescription);
                      setIsEditingProblem(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="rounded-xl font-semibold"
                    disabled={problemMutation.isPending}
                    type="button"
                    onClick={handleSaveProblem}
                  >
                    <Save className="size-4" strokeWidth={1.75} />
                    {problemMutation.isPending ? 'Salvando...' : 'Salvar problema'}
                  </Button>
                </div>
              </div>
            ) : (
              <p>{query.data.problemDescription}</p>
            )}
            {query.data.notes ? (
              <div className="rounded-lg border-l-4 border-sky-400 bg-sky-500/10 p-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sky-500">
                  <Info className="size-4" strokeWidth={1.75} />
                  Observações internas
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{query.data.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="bg-card shadow-xs">
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

      <Card className="bg-card shadow-xs">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">Itens da OS</p>
            <CardTitle className="mt-1 text-xl">Serviços executados e peças</CardTitle>
          </div>
          {canManageStockParts ? (
            <div className="flex flex-wrap gap-2">
              <Button className="rounded-xl font-semibold" variant="outline" onClick={() => setStockPartDialogOpen(true)}>
                <Plus className="size-4" strokeWidth={1.75} />
                Adicionar serviço
              </Button>
              <Button className="rounded-xl font-semibold" variant="outline" onClick={() => handleOpenPendingPartDialog()}>
                <Plus className="size-4" strokeWidth={1.75} />
                Registrar peça em falta
              </Button>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <p className="mb-3 flex items-center gap-2 font-bold"><Wrench className="size-4 text-primary" /> Serviços <span className="rounded-full bg-muted px-2 text-sm text-muted-foreground">{budgetLaborItems.length}</span></p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Garantia</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  {canManageStockParts ? <TableHead className="text-right">Ações</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgetLaborItems.length ? budgetLaborItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold">{item.description}</TableCell>
                    <TableCell>{item.serviceCode ? '90 dias' : '30 dias'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="[font-variant-numeric:tabular-nums]">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(item.totalPrice)}</TableCell>
                    {canManageStockParts ? (
                      <TableCell className="text-right">
                        {item.id !== 'services-performed' ? (
                          <div className="inline-flex">
                            <Button
                              aria-label={`Editar ${item.description}`}
                              size="icon"
                              variant="ghost"
                              onClick={() => setExecutionItemToEdit(item)}
                            >
                              <Edit3 className="size-4" />
                            </Button>
                            <Button
                              aria-label={`Excluir ${item.description}`}
                              className="text-rose-600 hover:text-rose-700"
                              size="icon"
                              variant="ghost"
                              onClick={() => setExecutionItemToRemove(item)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ) : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell className="py-6 text-center text-muted-foreground" colSpan={canManageStockParts ? 6 : 5}>
                      Nenhum serviço registrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {plannedParts.length ? (
            <div>
              <p className="mb-3 flex items-center gap-2 font-bold">
                <Package className="size-4 text-primary" /> Peças cobradas na OS{' '}
                <span className="rounded-full bg-muted px-2 text-sm text-muted-foreground">{plannedParts.length}</span>
              </p>
              <p className="mb-3 text-sm text-muted-foreground">
                Estas peças compõem o subtotal de peças e o total a receber do cliente.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Peça</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    {canManageStockParts ? <TableHead className="text-right">Ações</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plannedParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-mono text-sm font-semibold tracking-[0.08em]">{part.inventoryItem.internalCode}</TableCell>
                      <TableCell className="font-bold">{part.inventoryItem.name}</TableCell>
                      <TableCell>{part.quantity}</TableCell>
                    <TableCell className="[font-variant-numeric:tabular-nums]">{formatCurrency(part.unitPrice)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(part.totalPrice)}</TableCell>
                    {canManageStockParts ? (
                      <TableCell className="text-right">
                        <div className="inline-flex">
                          <Button
                            aria-label={`Editar previsão de ${part.inventoryItem.name}`}
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const item = editablePlannedItems.find((candidate) => candidate.id === part.id);
                              if (item) setExecutionItemToEdit(item);
                            }}
                          >
                            <Edit3 className="size-4" />
                          </Button>
                          <Button
                            aria-label={`Excluir previsão de ${part.inventoryItem.name}`}
                            className="text-rose-600 hover:text-rose-700"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const item = editablePlannedItems.find((candidate) => candidate.id === part.id);
                              if (item) setExecutionItemToRemove(item);
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}

          <div>
            <p className="mb-3 flex items-center gap-2 font-bold"><Package className="size-4 text-primary" /> Baixas de peças no estoque <span className="rounded-full bg-muted px-2 text-sm text-muted-foreground">{appliedParts.length}</span></p>
            <p className="mb-3 text-sm text-muted-foreground">
              Controle operacional das peças efetivamente retiradas do estoque para esta OS.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Peça</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  {canManageStockParts ? <TableHead className="text-right">Ações</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {appliedParts.length ? appliedParts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-mono text-sm font-semibold tracking-[0.08em]">{part.inventoryItem.internalCode}</TableCell>
                    <TableCell className="font-bold">{part.inventoryItem.name}</TableCell>
                    <TableCell>{part.quantity}</TableCell>
                    <TableCell className="[font-variant-numeric:tabular-nums]">{formatCurrency(part.unitPrice)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(part.totalPrice)}</TableCell>
                    {canManageStockParts ? (
                      <TableCell className="text-right">
                        {removableStockPartIds.has(part.id) ? (
                          <Button
                            aria-label={`Remover ${part.inventoryItem.name} da OS`}
                            className="text-rose-600 hover:text-rose-700"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const appliedPart = query.data.parts?.find((item) => item.id === part.id);
                              if (appliedPart) setStockPartToRemove(appliedPart);
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        ) : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell className="py-6 text-center text-muted-foreground" colSpan={canManageStockParts ? 6 : 5}>
                      Nenhuma baixa de estoque registrada.
                    </TableCell>
                  </TableRow>
                )}
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

      <PendingPartDialog
        open={!isReadOnly && pendingPartDialogOpen}
        pendingPart={pendingPartToEdit}
        isSubmitting={createPendingPartMutation.isPending || updatePendingPartMutation.isPending}
        onOpenChange={(open) => {
          setPendingPartDialogOpen(open);
          if (!open) setPendingPartToEdit(null);
        }}
        onSubmit={handleSavePendingPart}
      />
      <ServiceOrderStockPartDialog
        open={canManageStockParts && stockPartDialogOpen}
        isSubmitting={addServiceMutation.isPending}
        onOpenChange={setStockPartDialogOpen}
        onSubmit={(payload) => addServiceMutation.mutate(payload)}
      />
      <ServiceOrderItemDialog
        item={canManageStockParts ? executionItemToEdit : null}
        isSubmitting={updateExecutionItemMutation.isPending}
        onCancel={() => setExecutionItemToEdit(null)}
        onSubmit={(payload) => {
          if (executionItemToEdit) {
            updateExecutionItemMutation.mutate({ itemId: executionItemToEdit.id, payload });
          }
        }}
      />
      <RemoveServiceOrderPartDialog
        part={canManageStockParts ? stockPartToRemove : null}
        isSubmitting={removeStockPartMutation.isPending}
        onCancel={() => setStockPartToRemove(null)}
        onConfirm={() => {
          if (stockPartToRemove) removeStockPartMutation.mutate(stockPartToRemove.id);
        }}
      />
      <RemoveServiceOrderItemDialog
        item={canManageStockParts ? executionItemToRemove : null}
        isSubmitting={removeExecutionItemMutation.isPending}
        onCancel={() => setExecutionItemToRemove(null)}
        onConfirm={() => {
          if (executionItemToRemove) removeExecutionItemMutation.mutate(executionItemToRemove.id);
        }}
      />
      <ResumeServiceOrderDialog
        open={!isReadOnly && resumeDialogOpen}
        isSubmitting={resumeMutation.isPending}
        onOpenChange={setResumeDialogOpen}
        onConfirm={() => resumeMutation.mutate()}
      />
      {!isReadOnly && regressiveStatusToConfirm ? (
        <RegressiveStatusChangeDialog
          open={Boolean(regressiveStatusToConfirm)}
          currentStatus={query.data.status}
          nextStatus={regressiveStatusToConfirm}
          isSubmitting={mutation.isPending}
          onCancel={handleCancelRegressiveStatusChange}
          onConfirm={handleConfirmRegressiveStatusChange}
        />
      ) : null}
    </PageContainer>
  );
}
