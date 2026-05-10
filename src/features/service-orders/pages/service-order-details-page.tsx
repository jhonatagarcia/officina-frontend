import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { mechanicsService } from '@/features/mechanics/services/mechanics-service';
import { ServiceOrderActionsCard } from '@/features/service-orders/components/service-order-actions-card';
import { ServiceOrderReportCard } from '@/features/service-orders/components/service-order-report-card';
import { serviceOrdersService } from '@/features/service-orders/services/service-orders-service';
import type { ServiceOrderStatus } from '@/features/service-orders/types';
import {
  getTodayDateInputMin,
  toDateInputValue,
  validateExpectedDeliveryAtValue,
} from '@/features/service-orders/lib/service-order-details';
import { generateServiceOrderPdf } from '@/features/service-orders/lib/service-order-pdf';
import { getAppliedServiceOrderParts } from '@/features/service-orders/lib/service-order-parts';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { formatServiceOrderNumber } from '@/lib/utils';

export function ServiceOrderDetailsPage() {
  const { id = '' } = useParams();
  const [nextStatus, setNextStatus] = useState<ServiceOrderStatus | ''>('');
  const [expectedDeliveryAt, setExpectedDeliveryAt] = useState('');
  const [expectedDeliveryAtError, setExpectedDeliveryAtError] = useState<string | null>(null);
  const [selectedMechanicId, setSelectedMechanicId] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['ordem-servico', id], queryFn: () => serviceOrdersService.getById(id) });
  const mechanicsQuery = useQuery({
    queryKey: ['mecanicos', 'options'],
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
      if (updatedOrder.whatsappNotification?.status === 'FAILED') {
        toast.error('Status atualizado, mas não foi possível enviar a mensagem no WhatsApp.');
      }

      query.refetch();
    },
    onError: (error: { message?: string | string[] }) => {
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      toast.error(message || 'Não foi possível atualizar o status da ordem de serviço.');
    },
  });
  const deliveryEstimateMutation = useMutation({
    mutationFn: (value: string) =>
      serviceOrdersService.update(id, {
        expectedDeliveryAt: value || null,
      }),
    onSuccess: () => {
      setExpectedDeliveryAtError(null);
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Previsão de entrega atualizada.');
      query.refetch();
    },
    onError: (error: { message?: string | string[] }) => {
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      const normalizedMessage = message || 'Informe uma data válida para salvar a previsão de entrega.';
      setExpectedDeliveryAtError(normalizedMessage);
      toast.error(normalizedMessage);
    },
  });
  const mechanicMutation = useMutation({
    mutationFn: (mechanicId: string) =>
      serviceOrdersService.update(id, {
        mechanicId: mechanicId || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Mecânico responsável atualizado.');
      query.refetch();
    },
  });

  useEffect(() => {
    setExpectedDeliveryAt(toDateInputValue(query.data?.expectedDeliveryAt));
    setExpectedDeliveryAtError(null);
  }, [query.data?.expectedDeliveryAt]);

  useEffect(() => {
    setSelectedMechanicId(query.data?.mechanicId ?? '');
  }, [query.data?.mechanicId]);

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  const budgetLaborItems = (query.data.budgetItems ?? []).filter(
    (item) => item.type === 'LABOR' || item.type === 'LABOR_AND_PART',
  );
  const appliedParts = getAppliedServiceOrderParts(query.data);
  const mechanicOptions = mechanicsQuery.data?.data ?? [];
  const canGeneratePdf = query.data.status === 'ENTREGUE';
  const minExpectedDeliveryAt = getTodayDateInputMin();

  const handleSaveExpectedDeliveryAt = () => {
    const validationError = validateExpectedDeliveryAtValue(expectedDeliveryAt);

    if (validationError) {
      setExpectedDeliveryAtError(validationError);
      toast.error(validationError);
      return;
    }

    setExpectedDeliveryAtError(null);
    deliveryEstimateMutation.mutate(expectedDeliveryAt);
  };

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
      <PageHeader
        title={`Ordem de serviço ${formatServiceOrderNumber(query.data.orderNumber)}`}
        description={`${query.data.clientName} • ${query.data.vehicleLabel}`}
      />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <ServiceOrderReportCard order={query.data} laborItems={budgetLaborItems} appliedParts={appliedParts} />
        <ServiceOrderActionsCard
          mechanicOptions={mechanicOptions}
          mechanicsDisabled={mechanicsQuery.isLoading || mechanicMutation.isPending}
          mechanicSavePending={mechanicMutation.isPending}
          selectedMechanicId={selectedMechanicId}
          onSelectedMechanicIdChange={setSelectedMechanicId}
          onSaveMechanic={() => mechanicMutation.mutate(selectedMechanicId)}
          expectedDeliveryAt={expectedDeliveryAt}
          expectedDeliveryAtError={expectedDeliveryAtError}
          minExpectedDeliveryAt={minExpectedDeliveryAt}
          deliveryEstimatePending={deliveryEstimateMutation.isPending}
          onExpectedDeliveryAtChange={(value) => {
            setExpectedDeliveryAt(value);
            setExpectedDeliveryAtError(validateExpectedDeliveryAtValue(value));
          }}
          onSaveExpectedDeliveryAt={handleSaveExpectedDeliveryAt}
          nextStatus={nextStatus}
          currentStatus={query.data.status}
          statusPending={mutation.isPending}
          onNextStatusChange={setNextStatus}
          onUpdateStatus={handleUpdateStatus}
          canGeneratePdf={canGeneratePdf}
          isGeneratingPdf={isGeneratingPdf}
          onGeneratePdf={handleGeneratePdf}
        />
      </div>
    </PageContainer>
  );
}
