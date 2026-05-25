import type { PendingPartStatus } from '@/features/service-orders/types';

export function getPendingPartStatusLabel(status: PendingPartStatus | string) {
  switch (status) {
    case 'PENDING':
      return 'Aguardando peça';
    case 'PARTIALLY_AVAILABLE':
      return 'Parcialmente disponível';
    case 'AVAILABLE':
      return 'Peça disponível';
    case 'RESOLVED':
      return 'Resolvido';
    case 'CANCELED':
      return 'Cancelado';
    default:
      return 'Aguardando peça';
  }
}

export function getPendingPartStatusClassName(status: PendingPartStatus | string) {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-emerald-50 text-emerald-700';
    case 'PARTIALLY_AVAILABLE':
      return 'bg-amber-50 text-amber-700';
    case 'RESOLVED':
      return 'bg-sky-50 text-sky-700';
    case 'CANCELED':
      return 'bg-stone-100 text-stone-700';
    default:
      return 'bg-orange-50 text-orange-700';
  }
}

export function canResumeFromPendingPartStatus(status: PendingPartStatus | string) {
  return status === 'AVAILABLE';
}
