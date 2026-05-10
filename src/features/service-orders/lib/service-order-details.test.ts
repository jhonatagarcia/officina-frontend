import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  toDateInputValue,
  validateExpectedDeliveryAtValue,
} from '@/features/service-orders/lib/service-order-details';

describe('service-order-details helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-08T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('toDateInputValue', () => {
    it('extrai apenas a data inicial em formato de input', () => {
      expect(toDateInputValue('2026-05-09T14:30:00.000Z')).toBe('2026-05-09');
      expect(toDateInputValue('2026-05-09')).toBe('2026-05-09');
    });

    it('retorna vazio para valor ausente ou fora do formato esperado', () => {
      expect(toDateInputValue(null)).toBe('');
      expect(toDateInputValue(undefined)).toBe('');
      expect(toDateInputValue('09/05/2026')).toBe('');
    });
  });

  describe('validateExpectedDeliveryAtValue', () => {
    it('aceita valor vazio, data atual e data futura', () => {
      expect(validateExpectedDeliveryAtValue('')).toBeNull();
      expect(validateExpectedDeliveryAtValue('2026-05-08')).toBeNull();
      expect(validateExpectedDeliveryAtValue('2026-05-09')).toBeNull();
    });

    it('rejeita formato invalido ou ano sem quatro digitos', () => {
      expect(validateExpectedDeliveryAtValue('09/05/2026')).toBe('Informe uma data valida.');
      expect(validateExpectedDeliveryAtValue('026-05-09')).toBe('Informe uma data valida.');
    });

    it('rejeita data anterior ao dia atual', () => {
      expect(validateExpectedDeliveryAtValue('2026-05-07')).toBe('A previsao de entrega nao pode ser anterior ao dia atual.');
    });
  });
});
