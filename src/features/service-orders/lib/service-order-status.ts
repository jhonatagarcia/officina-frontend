import type { ServiceOrderPendingPart, ServiceOrderStatus } from '@/features/service-orders/types';
import { canResumeFromPendingPartStatus } from '@/features/service-orders/lib/pending-part-status';

export const SERVICE_ORDER_STATUSES: ServiceOrderStatus[] = [
  'ABERTA',
  'AGUARDANDO_PECA',
  'EM_ANDAMENTO',
  'FINALIZADA',
  'ENTREGUE',
];

const serviceOrderStatusLabels: Record<ServiceOrderStatus, string> = {
  ABERTA: 'Aberta',
  AGUARDANDO_PECA: 'Aguardando peça',
  EM_ANDAMENTO: 'Em andamento',
  FINALIZADA: 'Concluída',
  ENTREGUE: 'Entregue',
};

export function getServiceOrderStatusLabel(status: ServiceOrderStatus) {
  return serviceOrderStatusLabels[status];
}

export function getServiceOrderStatusTone(status: ServiceOrderStatus) {
  if (status === 'ABERTA') return 'stone';
  if (status === 'AGUARDANDO_PECA') return 'amber';
  if (status === 'EM_ANDAMENTO') return 'orange';
  if (status === 'FINALIZADA') return 'emerald';
  return 'sky';
}

export function isRegressiveServiceOrderStatusChange(
  currentStatus: ServiceOrderStatus,
  nextStatus: ServiceOrderStatus,
) {
  return SERVICE_ORDER_STATUSES.indexOf(nextStatus) < SERVICE_ORDER_STATUSES.indexOf(currentStatus);
}

export function isReadOnlyServiceOrderStatus(status: ServiceOrderStatus | undefined) {
  return status === 'ENTREGUE';
}

export function canShowResumeServiceOrderAction(
  serviceOrderStatus: ServiceOrderStatus | undefined,
  pendingParts: Pick<ServiceOrderPendingPart, 'status'>[],
) {
  return serviceOrderStatus === 'AGUARDANDO_PECA' && pendingParts.some((part) => canResumeFromPendingPartStatus(part.status));
}

export function shouldShowWaitingForPartStep(
  order: {
    status: ServiceOrderStatus;
    pendingParts?: Pick<ServiceOrderPendingPart, 'quantityRequired' | 'quantityAvailable' | 'status'>[] | undefined;
  },
) {
  if (order.status === 'AGUARDANDO_PECA') return true;

  return (order.pendingParts ?? []).length > 0;
}
