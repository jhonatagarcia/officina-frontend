import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
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
import { formatCurrency, formatDate } from '@/lib/utils';

export function ServiceOrderDetailsPage() {
  const { id = '' } = useParams();
  const [nextStatus, setNextStatus] = useState<ServiceOrderStatus | ''>('');
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['ordem-servico', id], queryFn: () => serviceOrdersService.getById(id) });
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

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <PageContainer>
      <PageHeader title={`Ordem de serviço #${query.data.id}`} description={`${query.data.clientName} • ${query.data.vehicleLabel}`} />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da execução</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <StatusBadge status={query.data.status} />
            </div>
            <p><span className="font-medium">Diagnóstico:</span> {query.data.diagnosis ?? '-'}</p>
            <p><span className="font-medium">Problema relatado:</span> {query.data.problemDescription}</p>
            <p><span className="font-medium">Serviços executados:</span> {query.data.servicesPerformed ?? '-'}</p>
            <p><span className="font-medium">Checklist:</span> {query.data.vehicleChecklist ?? '-'}</p>
            <p><span className="font-medium">Previsão de entrega:</span> {query.data.expectedDeliveryAt ? formatDate(query.data.expectedDeliveryAt) : '-'}</p>
            <p><span className="font-medium">Mecânico responsável:</span> {query.data.mechanicName ?? '-'}</p>
            <p><span className="font-medium">Observações:</span> {query.data.notes ?? '-'}</p>
            <div className="space-y-2 rounded-xl border p-4">
              <p className="font-medium">Peças aplicadas</p>
              {query.data.parts?.length ? (
                query.data.parts.map((part) => (
                  <div key={part.id} className="flex items-center justify-between text-sm">
                    <span>
                      {part.inventoryItem.internalCode} • {part.inventoryItem.name} x{part.quantity}
                    </span>
                    <span>{formatCurrency(part.totalPrice)}</span>
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
            <CardTitle>Atualizar status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
