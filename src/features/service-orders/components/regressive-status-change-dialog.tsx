import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getServiceOrderStatusLabel } from '@/features/service-orders/lib/service-order-status';
import type { ServiceOrderStatus } from '@/features/service-orders/types';

interface RegressiveStatusChangeDialogProps {
  open: boolean;
  currentStatus: ServiceOrderStatus;
  nextStatus: ServiceOrderStatus;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RegressiveStatusChangeDialog({
  open,
  currentStatus,
  nextStatus,
  isSubmitting,
  onCancel,
  onConfirm,
}: RegressiveStatusChangeDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isSubmitting) onCancel();
      }}
    >
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar alteração de status</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            Você está alterando esta OS para uma etapa anterior. Essa ação pode impactar o
            acompanhamento do serviço, o histórico da OS e os indicadores operacionais. Deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-semibold text-amber-900">Status atual</p>
            <p className="mt-1 text-amber-800">{getServiceOrderStatusLabel(currentStatus)}</p>
          </div>
          <div>
            <p className="font-semibold text-amber-900">Novo status</p>
            <p className="mt-1 text-amber-800">{getServiceOrderStatusLabel(nextStatus)}</p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting} onClick={onCancel}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isSubmitting}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isSubmitting ? 'Alterando...' : 'Confirmar alteração'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
