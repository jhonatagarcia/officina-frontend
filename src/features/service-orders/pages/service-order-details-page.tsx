import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { mechanicsService } from '@/features/mechanics/services/mechanics-service';
import { serviceOrdersService } from '@/features/service-orders/services/service-orders-service';
import type { ServiceOrderStatus } from '@/features/service-orders/types';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buildWhatsAppUrl, formatCurrency, formatDate, formatPhone, formatServiceOrderNumber } from '@/lib/utils';

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const timezoneOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - timezoneOffset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function ServiceOrderDetailsPage() {
  const { id = '' } = useParams();
  const [nextStatus, setNextStatus] = useState<ServiceOrderStatus | ''>('');
  const [expectedDeliveryAt, setExpectedDeliveryAt] = useState('');
  const [selectedMechanicId, setSelectedMechanicId] = useState('');
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['ordem-servico', id], queryFn: () => serviceOrdersService.getById(id) });
  const mechanicsQuery = useQuery({
    queryKey: ['mecanicos', 'options'],
    queryFn: () => mechanicsService.list({ page: 1, pageSize: 100, active: true }),
  });
  const mutation = useMutation({
    mutationFn: (status: Parameters<typeof serviceOrdersService.updateStatus>[1]) => serviceOrdersService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Status atualizado com sucesso.');
      query.refetch();
    },
  });
  const deliveryEstimateMutation = useMutation({
    mutationFn: (value: string) =>
      serviceOrdersService.update(id, {
        expectedDeliveryAt: value ? new Date(value).toISOString() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Previsão de entrega atualizada.');
      query.refetch();
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
    setExpectedDeliveryAt(toDateTimeLocalValue(query.data?.expectedDeliveryAt));
  }, [query.data?.expectedDeliveryAt]);

  useEffect(() => {
    setSelectedMechanicId(query.data?.mechanicId ?? '');
  }, [query.data?.mechanicId]);

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  const budgetLaborItems = (query.data.budgetItems ?? []).filter((item) => item.type === 'LABOR');
  const mechanicOptions = mechanicsQuery.data?.data ?? [];
  const whatsappUrl = buildWhatsAppUrl(query.data.client?.phone, 'Olá, seu carro está pronto!');
  const canSendWhatsAppNotification = query.data.status === 'FINALIZADA' && Boolean(whatsappUrl);

  return (
    <PageContainer>
      <PageHeader
        title={`Ordem de serviço ${formatServiceOrderNumber(query.data.orderNumber)}`}
        description={`${query.data.clientName} • ${query.data.vehicleLabel}`}
      />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da execução</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p><span className="font-medium">OS:</span> {formatServiceOrderNumber(query.data.orderNumber)}</p>
            <p><span className="font-medium">Cliente:</span> {query.data.clientName}</p>
            <p><span className="font-medium">Telefone:</span> {formatPhone(query.data.client?.phone)}</p>
            <p><span className="font-medium">Veículo:</span> {query.data.vehicleLabel}</p>
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <StatusBadge status={query.data.status} />
            </div>
            <p><span className="font-medium">Problema relatado:</span> {query.data.problemDescription}</p>
            <div className="space-y-2">
              <p className="font-medium">Serviços executados</p>
              {budgetLaborItems.length ? (
                budgetLaborItems.map((item) => (
                  <p key={item.id}>
                    {item.serviceCode ? `${item.serviceCode} • ` : ''}
                    {item.description}
                    {item.quantity > 1 ? ` x${item.quantity}` : ''}
                  </p>
                ))
              ) : (
                <p>-</p>
              )}
            </div>
            <p>
              <span className="font-medium">Previsão de entrega:</span>{' '}
              {query.data.expectedDeliveryAt ? formatDate(query.data.expectedDeliveryAt) : 'Não informada'}
            </p>
            <p><span className="font-medium">Mecânico responsável:</span> {query.data.mechanicName ?? '-'}</p>
            <p><span className="font-medium">Observações:</span> {query.data.notes ?? '-'}</p>
            <div className="space-y-2 rounded-xl border p-4">
              <p className="font-medium">Peças aplicadas</p>
              {query.data.parts?.length ? (
                query.data.parts.map((part) => (
                  <div key={part.id} className="grid gap-1 rounded-lg border border-border/60 p-3 text-sm">
                    <p className="font-medium">
                      {part.inventoryItem.internalCode} • {part.inventoryItem.name}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                      <span>Quantidade: {part.quantity}</span>
                      <span>Valor unitário: {formatCurrency(part.unitPrice)}</span>
                      <span>Subtotal: {formatCurrency(part.totalPrice)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma peça lançada nesta OS.</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ações da OS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mecânico responsável</Label>
              <Select disabled={mechanicsQuery.isLoading || mechanicMutation.isPending} onValueChange={setSelectedMechanicId} value={selectedMechanicId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um mecânico" />
                </SelectTrigger>
                <SelectContent>
                  {mechanicOptions.map((mechanic) => (
                    <SelectItem key={mechanic.id} value={mechanic.id}>
                      {mechanic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                disabled={mechanicsQuery.isLoading || mechanicMutation.isPending}
                variant="outline"
                onClick={() => mechanicMutation.mutate(selectedMechanicId)}
              >
                {mechanicMutation.isPending ? 'Salvando mecânico...' : 'Salvar mecânico'}
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedDeliveryAt">Previsão de entrega</Label>
              <Input
                id="expectedDeliveryAt"
                type="datetime-local"
                value={expectedDeliveryAt}
                onChange={(event) => setExpectedDeliveryAt(event.target.value)}
              />
              <Button
                className="w-full"
                disabled={deliveryEstimateMutation.isPending}
                variant="outline"
                onClick={() => deliveryEstimateMutation.mutate(expectedDeliveryAt)}
              >
                {deliveryEstimateMutation.isPending ? 'Salvando previsão...' : 'Salvar previsão'}
              </Button>
            </div>
            <Select onValueChange={(value) => setNextStatus(value as ServiceOrderStatus)} value={nextStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o novo status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ABERTA">Aberta</SelectItem>
                <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                <SelectItem value="FINALIZADA">Finalizada</SelectItem>
                <SelectItem value="ENTREGUE">Entregue</SelectItem>
              </SelectContent>
            </Select>
            <Button disabled={mutation.isPending || !nextStatus} className="w-full" onClick={() => nextStatus && mutation.mutate(nextStatus)}>
              {mutation.isPending ? 'Atualizando...' : 'Atualizar andamento'}
            </Button>
            <Button
              className="w-full"
              disabled={!canSendWhatsAppNotification}
              onClick={() => {
                if (!whatsappUrl) return;
                window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
              }}
            >
              Enviar notificação
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
