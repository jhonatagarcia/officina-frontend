import { describe, expect, it } from 'vitest';
import {
  canShowResumeServiceOrderAction,
  getServiceOrderStatusLabel,
  isRegressiveServiceOrderStatusChange,
  isReadOnlyServiceOrderStatus,
  shouldShowWaitingForPartStep,
} from '@/features/service-orders/lib/service-order-status';

describe('service-order-status', () => {
  it('identifica toda alteracao para uma etapa anterior da OS', () => {
    expect(isRegressiveServiceOrderStatusChange('EM_ANDAMENTO', 'ABERTA')).toBe(true);
    expect(isRegressiveServiceOrderStatusChange('EM_ANDAMENTO', 'AGUARDANDO_PECA')).toBe(true);
    expect(isRegressiveServiceOrderStatusChange('FINALIZADA', 'EM_ANDAMENTO')).toBe(true);
    expect(isRegressiveServiceOrderStatusChange('ENTREGUE', 'FINALIZADA')).toBe(true);
    expect(isRegressiveServiceOrderStatusChange('AGUARDANDO_PECA', 'ABERTA')).toBe(true);
    expect(isRegressiveServiceOrderStatusChange('EM_ANDAMENTO', 'FINALIZADA')).toBe(false);
  });

  it('mostra Retomar OS apenas para OS aguardando peca com peca disponivel', () => {
    expect(canShowResumeServiceOrderAction('AGUARDANDO_PECA', [{ status: 'AVAILABLE' }])).toBe(true);
    expect(canShowResumeServiceOrderAction('EM_ANDAMENTO', [{ status: 'AVAILABLE' }])).toBe(false);
    expect(canShowResumeServiceOrderAction('AGUARDANDO_PECA', [{ status: 'PENDING' }])).toBe(false);
  });

  it('mantem labels de status centralizados', () => {
    expect(getServiceOrderStatusLabel('AGUARDANDO_PECA')).toBe('Aguardando peça');
    expect(getServiceOrderStatusLabel('EM_ANDAMENTO')).toBe('Em andamento');
  });

  it('torna OS entregue somente leitura', () => {
    expect(isReadOnlyServiceOrderStatus('ENTREGUE')).toBe(true);
    expect(isReadOnlyServiceOrderStatus('FINALIZADA')).toBe(false);
  });

  it('mostra etapa aguardando peca quando a OS possui registro do processo de pendencia', () => {
    expect(shouldShowWaitingForPartStep({ status: 'AGUARDANDO_PECA', pendingParts: [] })).toBe(true);
    expect(
      shouldShowWaitingForPartStep({
        status: 'EM_ANDAMENTO',
        pendingParts: [{ status: 'PENDING', quantityRequired: 2, quantityAvailable: 0 }],
      }),
    ).toBe(true);
    expect(
      shouldShowWaitingForPartStep({
        status: 'EM_ANDAMENTO',
        pendingParts: [{ status: 'RESOLVED', quantityRequired: 2, quantityAvailable: 2 }],
      }),
    ).toBe(true);
    expect(shouldShowWaitingForPartStep({ status: 'EM_ANDAMENTO', pendingParts: [] })).toBe(false);
  });
});
