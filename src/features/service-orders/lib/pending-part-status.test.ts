import { describe, expect, it } from 'vitest';
import { canResumeFromPendingPartStatus, getPendingPartStatusLabel } from '@/features/service-orders/lib/pending-part-status';

describe('pending part status labels', () => {
  it('renderiza labels amigaveis para status internos', () => {
    expect(getPendingPartStatusLabel('PENDING')).toBe('Aguardando peça');
    expect(getPendingPartStatusLabel('PARTIALLY_AVAILABLE')).toBe('Parcialmente disponível');
    expect(getPendingPartStatusLabel('AVAILABLE')).toBe('Peça disponível');
    expect(getPendingPartStatusLabel('RESOLVED')).toBe('Resolvido');
    expect(getPendingPartStatusLabel('CANCELED')).toBe('Cancelado');
  });

  it('permite retomar apenas quando a peca esta disponivel', () => {
    expect(canResumeFromPendingPartStatus('AVAILABLE')).toBe(true);
    expect(canResumeFromPendingPartStatus('PENDING')).toBe(false);
  });
});
