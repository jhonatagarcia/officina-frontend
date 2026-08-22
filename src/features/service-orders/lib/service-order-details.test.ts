import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getServiceOrderLaborItems,
  toDateInputValue,
  validateExpectedDeliveryAtValue,
} from '@/features/service-orders/lib/service-order-details';
import type { ServiceOrder } from '@/features/service-orders/types';

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

  describe('getServiceOrderLaborItems', () => {
    const baseOrder: ServiceOrder = {
      id: 'os-1',
      orderNumber: 'OS-1',
      budgetId: null,
      clientId: 'client-1',
      vehicleId: 'vehicle-1',
      mechanicId: null,
      clientName: 'Cliente',
      vehicleLabel: 'ABC1234',
      mechanicName: null,
      problemDescription: 'Problema',
      diagnosis: null,
      servicesPerformed: null,
      vehicleChecklist: null,
      openedAt: '2026-05-08',
      expectedDeliveryAt: null,
      finishedAt: null,
      deliveredAt: null,
      status: 'ABERTA',
      notes: null,
      createdAt: '2026-05-08',
      updatedAt: '2026-05-08',
    };

    it('usa itens de mao de obra do orçamento quando disponíveis', () => {
      const items = getServiceOrderLaborItems({
        ...baseOrder,
        budgetItems: [
          {
            id: 'labor-1',
            type: 'LABOR',
            inventoryItemId: null,
            serviceCode: 'SRV-001',
            description: 'Troca de óleo',
            quantity: 1,
            unitPrice: 120,
            totalPrice: 120,
            inventoryItem: null,
          },
        ],
      });

      expect(items).toHaveLength(1);
      const firstItem = items[0];
      if (!firstItem) throw new Error('Expected one labor item');
      expect(firstItem.description).toBe('Troca de óleo');
    });

    it('cria item de serviço a partir de servicesPerformed quando não há budgetItems', () => {
      const items = getServiceOrderLaborItems({
        ...baseOrder,
        servicesPerformed: 'Serviço executado manualmente',
        laborTotal: 300,
      });

      expect(items).toEqual([
        expect.objectContaining({
          id: 'services-performed',
          type: 'LABOR',
          description: 'Serviço executado manualmente',
          unitPrice: 300,
          totalPrice: 300,
        }),
      ]);
    });

    it('prioriza o servico editado da execucao sem alterar o item orcado', () => {
      const items = getServiceOrderLaborItems({
        ...baseOrder,
        budgetItems: [
          {
            id: 'budget-labor',
            type: 'LABOR',
            inventoryItemId: null,
            serviceCode: 'SRV-001',
            description: 'Servico aprovado',
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
            inventoryItem: null,
          },
        ],
        executionItems: [
          {
            id: 'execution-labor',
            type: 'LABOR',
            inventoryItemId: null,
            serviceCode: 'SRV-001',
            description: 'Servico executado corrigido',
            quantity: 2,
            unitPrice: 100,
            totalPrice: 200,
            inventoryItem: null,
          },
        ],
      });

      expect(items).toEqual([
        expect.objectContaining({ id: 'execution-labor', description: 'Servico executado corrigido', quantity: 2 }),
      ]);
    });

    it('nao restaura servico orcado ou legado apos excluir todos os itens da execucao', () => {
      const items = getServiceOrderLaborItems({
        ...baseOrder,
        servicesPerformed: 'Servico legado',
        executionItemsMaterialized: true,
        executionItems: [],
        budgetItems: [
          {
            id: 'budget-labor',
            type: 'LABOR',
            inventoryItemId: null,
            serviceCode: 'SRV-001',
            description: 'Servico aprovado',
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
            inventoryItem: null,
          },
        ],
      });

      expect(items).toEqual([]);
    });

    it('mostra somente a parcela de mao de obra de um item misto', () => {
      const items = getServiceOrderLaborItems({
        ...baseOrder,
        budgetItems: [
          {
            id: 'mixed-1',
            type: 'LABOR_AND_PART',
            serviceCatalogItemId: 'service-1',
            inventoryItemId: 'inventory-1',
            serviceCode: 'SRV-001',
            description: 'Revisao + filtro',
            quantity: 1,
            unitPrice: 360,
            totalPrice: 360,
            laborUnitPrice: 200.2,
            laborTotalPrice: 200.2,
            partUnitPrice: 159.8,
            partTotalPrice: 159.8,
            inventoryItem: { id: 'inventory-1', name: 'Filtro', internalCode: 'FIL-001' },
          },
        ],
      });

      expect(items).toEqual([
        expect.objectContaining({ unitPrice: 200.2, totalPrice: 200.2 }),
      ]);
    });
  });
});
