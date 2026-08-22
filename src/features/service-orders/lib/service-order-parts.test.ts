import { describe, expect, it } from 'vitest';
import {
  getAppliedServiceOrderParts,
  getPlannedServiceOrderParts,
} from '@/features/service-orders/lib/service-order-parts';
import type { ServiceOrder } from '@/features/service-orders/types';

const baseOrder: ServiceOrder = {
  id: 'os-1',
  orderNumber: 'OS-1',
  budgetId: 'budget-1',
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

describe('service-order-parts helpers', () => {
  it('mantem peca orcada como prevista sem classifica-la como aplicada', () => {
    const order: ServiceOrder = {
      ...baseOrder,
      budgetItems: [
        {
          id: 'budget-part-1',
          type: 'PART',
          inventoryItemId: 'inventory-1',
          serviceCode: null,
          description: 'Filtro de oleo',
          quantity: 1,
          unitPrice: 45,
          totalPrice: 45,
          inventoryItem: { id: 'inventory-1', name: 'Filtro de oleo', internalCode: 'FO-001' },
        },
      ],
      parts: [],
    };

    expect(getPlannedServiceOrderParts(order)).toHaveLength(1);
    expect(getAppliedServiceOrderParts(order)).toEqual([]);
  });

  it('retorna somente consumos registrados como pecas aplicadas', () => {
    const order: ServiceOrder = {
      ...baseOrder,
      parts: [
        {
          id: 'part-1',
          serviceOrderId: baseOrder.id,
          inventoryItemId: 'inventory-1',
          quantity: 2,
          unitPrice: 45,
          totalPrice: 90,
          createdAt: '2026-05-08',
          updatedAt: '2026-05-08',
          inventoryItem: { id: 'inventory-1', name: 'Filtro de oleo', internalCode: 'FO-001' },
        },
      ],
    };

    expect(getAppliedServiceOrderParts(order)).toEqual([
      expect.objectContaining({ id: 'part-1', quantity: 2, totalPrice: 90 }),
    ]);
  });

  it('usa itens editados da execucao no lugar da previsao original', () => {
    const order: ServiceOrder = {
      ...baseOrder,
      budgetItems: [
        {
          id: 'budget-part-1',
          type: 'PART',
          inventoryItemId: 'inventory-1',
          serviceCode: null,
          description: 'Filtro original',
          quantity: 1,
          unitPrice: 45,
          totalPrice: 45,
          inventoryItem: { id: 'inventory-1', name: 'Filtro original', internalCode: 'FO-001' },
        },
      ],
      executionItems: [
        {
          id: 'execution-part-1',
          type: 'PART',
          inventoryItemId: 'inventory-2',
          serviceCode: null,
          description: 'Filtro corrigido',
          quantity: 2,
          unitPrice: 60,
          totalPrice: 120,
          inventoryItem: { id: 'inventory-2', name: 'Filtro corrigido', internalCode: 'FC-002' },
        },
      ],
    };

    expect(getPlannedServiceOrderParts(order)).toEqual([
      expect.objectContaining({ id: 'execution-part-1', quantity: 2, totalPrice: 120 }),
    ]);
  });

  it('nao restaura peca orcada quando a execucao materializada fica vazia', () => {
    const order: ServiceOrder = {
      ...baseOrder,
      executionItemsMaterialized: true,
      executionItems: [],
      budgetItems: [
        {
          id: 'budget-part-1',
          type: 'PART',
          inventoryItemId: 'inventory-1',
          serviceCode: null,
          description: 'Filtro original',
          quantity: 1,
          unitPrice: 45,
          totalPrice: 45,
          inventoryItem: { id: 'inventory-1', name: 'Filtro original', internalCode: 'FO-001' },
        },
      ],
    };

    expect(getPlannedServiceOrderParts(order)).toEqual([]);
  });

  it('ignora item misto sem relacionamento de estoque carregado', () => {
    const order: ServiceOrder = {
      ...baseOrder,
      budgetItems: [
        {
          id: 'budget-mixed-1',
          type: 'LABOR_AND_PART',
          serviceCatalogItemId: 'service-1',
          inventoryItemId: 'inventory-1',
          serviceCode: 'SRV-001',
          description: 'Troca de oleo + oleo',
          quantity: 1,
          unitPrice: 180,
          totalPrice: 180,
          inventoryItem: undefined as unknown as null,
        },
      ],
    };

    expect(getPlannedServiceOrderParts(order)).toEqual([]);
  });

  it('mostra somente a parcela da peca de um item misto', () => {
    const order: ServiceOrder = {
      ...baseOrder,
      budgetItems: [
        {
          id: 'budget-mixed-1',
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
    };

    expect(getPlannedServiceOrderParts(order)).toEqual([
      expect.objectContaining({ unitPrice: 159.8, totalPrice: 159.8 }),
    ]);
  });

  it('mantem peca legada visivel mesmo sem vinculo atual com o estoque', () => {
    const order: ServiceOrder = {
      ...baseOrder,
      budgetItems: [
        {
          id: 'legacy-part-1',
          type: 'PART',
          inventoryItemId: null,
          serviceCode: null,
          description: 'Filtro de ar Tecfil',
          quantity: 1,
          unitPrice: 69.9,
          totalPrice: 69.9,
          inventoryItem: null,
        },
      ],
    };

    expect(getPlannedServiceOrderParts(order)).toEqual([
      expect.objectContaining({
        unitPrice: 69.9,
        totalPrice: 69.9,
        inventoryItem: expect.objectContaining({
          name: 'Filtro de ar Tecfil',
          internalCode: '-',
        }) as unknown,
      }),
    ]);
  });
});
