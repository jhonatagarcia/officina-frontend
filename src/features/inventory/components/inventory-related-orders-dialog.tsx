import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { serviceOrdersService } from '@/features/service-orders/services/service-orders-service';
import { ResumeServiceOrderDialog } from '@/features/service-orders/components/resume-service-order-dialog';
import { canResumeFromPendingPartStatus, getPendingPartStatusLabel } from '@/features/service-orders/lib/pending-part-status';
import { canShowResumeServiceOrderAction } from '@/features/service-orders/lib/service-order-status';
import type { RelatedPendingServiceOrders, RelatedPendingServiceOrderSuggestion } from '@/features/inventory/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatPlate, formatServiceOrderNumber } from '@/lib/utils';

interface InventoryRelatedOrdersDialogProps {
  open: boolean;
  related: RelatedPendingServiceOrders | null;
  onOpenChange: (open: boolean) => void;
  onCloseWithoutAction: () => void;
}

export function InventoryRelatedOrdersDialog({
  open,
  related,
  onOpenChange,
  onCloseWithoutAction,
}: InventoryRelatedOrdersDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [orderToResume, setOrderToResume] = useState<RelatedPendingServiceOrderSuggestion | null>(null);
  const resumeMutation = useMutation({
    mutationFn: (serviceOrderId: string) => serviceOrdersService.resumeAfterPartsArrival(serviceOrderId),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', updatedOrder.id] });
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', updatedOrder.id, 'pending-parts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('OS retomada com sucesso.');
      if (updatedOrder.whatsappNotification?.status === 'SENT') {
        toast.success('Notificação enviada pelo WhatsApp.');
      }
      setOrderToResume(null);
      onOpenChange(false);
    },
    onError: (error: { message?: string | string[] }) => {
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      toast.error(message || 'Não foi possível retomar a OS.');
    },
  });

  const items = related?.items ?? [];
  const canResumeSuggestion = (item: RelatedPendingServiceOrderSuggestion) => {
    if (item.suggestedAction !== 'RESUME_SERVICE_ORDER') return false;
    if (!canResumeFromPendingPartStatus(item.status)) return false;

    return item.serviceOrderStatus
      ? canShowResumeServiceOrderAction(item.serviceOrderStatus, [{ status: item.status }])
      : true;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Peça reposta com sucesso</DialogTitle>
            <DialogDescription>
              {items.length === 1
                ? 'Essa peça atende 1 ordem de serviço aguardando peça.'
                : `Essa peça atende ${items.length} ordens de serviço aguardando peça.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.pendingPartId} className="rounded-xl border border-border-soft p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-mono text-sm font-bold text-primary">{formatServiceOrderNumber(item.orderNumber)}</p>
                    <p className="mt-1 font-semibold">{item.clientName}</p>
                    <p className="text-sm text-muted-foreground">Placa {formatPlate(item.vehiclePlate)}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Necessário: {item.quantityRequired} · Disponível: {item.quantityAvailable}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-500">{getPendingPartStatusLabel(item.status)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="rounded-xl font-semibold"
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/app/ordens-servico/${item.serviceOrderId}`)}
                    >
                      Ver OS
                    </Button>
                    {canResumeSuggestion(item) ? (
                      <Button className="rounded-xl font-semibold" type="button" onClick={() => setOrderToResume(item)}>
                        Retomar OS
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCloseWithoutAction}>
              Agora não
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ResumeServiceOrderDialog
        open={Boolean(orderToResume)}
        isSubmitting={resumeMutation.isPending}
        onOpenChange={(isOpen) => {
          if (!isOpen) setOrderToResume(null);
        }}
        onConfirm={() => {
          if (orderToResume) resumeMutation.mutate(orderToResume.serviceOrderId);
        }}
      />
    </>
  );
}
