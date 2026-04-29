import { describe, expect, it, vi } from 'vitest';
import { dashboardService } from '@/features/dashboard/services/dashboard-service';
import { budgetsService } from '@/features/budgets/services/budgets-service';
import { inventoryService } from '@/features/inventory/services/inventory-service';
import { serviceOrdersService } from '@/features/service-orders/services/service-orders-service';
import { http } from '@/services/api/http';

vi.mock('@/services/api/http', () => ({
  http: {
    get: vi.fn(),
  },
}));

vi.mock('@/features/inventory/services/inventory-service', () => ({
  inventoryService: {
    getLowStockAlerts: vi.fn(),
  },
}));

vi.mock('@/features/service-orders/services/service-orders-service', () => ({
  serviceOrdersService: {
    list: vi.fn(),
  },
}));

vi.mock('@/features/budgets/services/budgets-service', () => ({
  budgetsService: {
    list: vi.fn(),
  },
}));

describe('dashboardService', () => {
  it('monta alertas operacionais a partir de dados reais do backend', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: {
        serviceOrders: {
          open: 2,
          inProgress: 3,
          readyForDelivery: 1,
        },
        budgets: {
          pending: 2,
        },
        financial: {
          monthRevenue: '12345.67',
          stockOutValue: '890.25',
        },
        inventory: {
          lowStockCount: 3,
          lowStockItems: [],
        },
      },
    });

    vi.mocked(inventoryService.getLowStockAlerts).mockResolvedValueOnce([
      {
        id: 'inv-1',
        name: 'Filtro de óleo',
        internalCode: 'FO-01',
        category: 'Lubrificação',
        supplier: 'Fornecedor A',
        quantity: 0,
        minimumQuantity: 2,
        cost: 10,
        salePrice: 20,
        status: 'CRITICO',
        createdAt: '2026-04-10T00:00:00.000Z',
        updatedAt: '2026-04-10T00:00:00.000Z',
      },
    ]);

    vi.mocked(serviceOrdersService.list)
      .mockResolvedValueOnce({
        data: [
          {
            id: 'os-1',
            orderNumber: 'OS-001',
            budgetId: null,
            clientId: 'c-1',
            vehicleId: 'v-1',
            mechanicId: null,
            clientName: 'Carlos Lima',
            vehicleLabel: 'ABC1234 • Fiat Uno',
            mechanicName: null,
            problemDescription: 'Revisão',
            diagnosis: null,
            servicesPerformed: null,
            vehicleChecklist: null,
            openedAt: '2026-04-10T00:00:00.000Z',
            expectedDeliveryAt: '2026-04-11T00:00:00.000Z',
            finishedAt: null,
            deliveredAt: null,
            status: 'ABERTA',
            notes: null,
            createdAt: '2026-04-10T00:00:00.000Z',
            updatedAt: '2026-04-10T00:00:00.000Z',
          },
        ],
        page: 1,
        pageSize: 100,
        total: 1,
        totalPages: 1,
      })
      .mockResolvedValueOnce({
        data: [],
        page: 1,
        pageSize: 100,
        total: 0,
        totalPages: 1,
      });

    vi.mocked(budgetsService.list).mockResolvedValueOnce({
      data: [
        {
          id: 'budget-1',
          code: 'ORC-001',
          clientId: 'c-1',
          vehicleId: 'v-1',
          status: 'PENDENTE',
          problemDescription: 'Troca de óleo',
          notes: null,
          subtotal: 120,
          discount: 0,
          total: 120,
          convertedToServiceOrder: false,
          approvedAt: null,
          rejectedAt: null,
          createdAt: '2026-04-12T00:00:00.000Z',
          updatedAt: '2026-04-12T00:00:00.000Z',
          items: [],
          client: {
            id: 'c-1',
            name: 'Carlos Lima',
            document: null,
          },
          vehicle: {
            id: 'v-1',
            plate: 'ABC1234',
            brand: 'Fiat',
            model: 'Uno',
            year: 2015,
          },
          serviceOrder: null,
        },
      ],
      page: 1,
      pageSize: 5,
      total: 1,
      totalPages: 1,
    });

    const overview = await dashboardService.getOverview();

    expect(overview.financial.monthRevenue).toBe(12345.67);
    expect(overview.financial.stockOutValue).toBe(890.25);
    expect(overview.operationalAlerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'critical-stock',
          severity: 'danger',
        }),
        expect.objectContaining({
          id: 'overdue-service-orders',
          severity: 'danger',
        }),
        expect.objectContaining({
          id: 'pending-budgets',
        }),
        expect.objectContaining({
          id: 'workshop-flow',
          actionLabel: 'Ver ordens de serviço',
          actionTo: '/app/ordens-servico',
        }),
      ]),
    );
  });

  it('ignora orcamentos aprovados nos alertas operacionais e usa o nome do cliente do pendente', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: {
        serviceOrders: {
          open: 0,
          inProgress: 0,
          readyForDelivery: 0,
        },
        budgets: {
          pending: 1,
        },
        financial: {
          monthRevenue: '0',
          stockOutValue: '0',
        },
        inventory: {
          lowStockCount: 0,
          lowStockItems: [],
        },
      },
    });

    vi.mocked(inventoryService.getLowStockAlerts).mockResolvedValueOnce([]);

    vi.mocked(serviceOrdersService.list)
      .mockResolvedValueOnce({
        data: [],
        page: 1,
        pageSize: 100,
        total: 0,
        totalPages: 1,
      })
      .mockResolvedValueOnce({
        data: [],
        page: 1,
        pageSize: 100,
        total: 0,
        totalPages: 1,
      });

    vi.mocked(budgetsService.list).mockResolvedValueOnce({
      data: [
        {
          id: 'budget-approved',
          code: 'ORC-010',
          clientId: 'c-10',
          vehicleId: 'v-10',
          status: 'APROVADO',
          problemDescription: 'Freio',
          notes: null,
          subtotal: 100,
          discount: 0,
          total: 100,
          convertedToServiceOrder: false,
          approvedAt: '2026-04-11T00:00:00.000Z',
          rejectedAt: null,
          createdAt: '2026-04-10T00:00:00.000Z',
          updatedAt: '2026-04-11T00:00:00.000Z',
          items: [],
          client: {
            id: 'c-10',
            name: 'Edna Regina dos Santos',
            document: null,
          },
          vehicle: {
            id: 'v-10',
            plate: 'AAA1234',
            brand: 'Fiat',
            model: 'Uno',
            year: 2012,
          },
          serviceOrder: null,
        },
        {
          id: 'budget-pending',
          code: 'ORC-011',
          clientId: 'c-11',
          vehicleId: 'v-11',
          status: 'PENDENTE',
          problemDescription: 'Suspensão',
          notes: null,
          subtotal: 200,
          discount: 0,
          total: 200,
          convertedToServiceOrder: false,
          approvedAt: null,
          rejectedAt: null,
          createdAt: '2026-04-12T00:00:00.000Z',
          updatedAt: '2026-04-12T00:00:00.000Z',
          items: [],
          client: {
            id: 'c-11',
            name: 'Jhonta',
            document: null,
          },
          vehicle: {
            id: 'v-11',
            plate: 'BBB1234',
            brand: 'VW',
            model: 'Gol',
            year: 2014,
          },
          serviceOrder: null,
        },
      ],
      page: 1,
      pageSize: 5,
      total: 2,
      totalPages: 1,
    });

    const overview = await dashboardService.getOverview();
    const pendingBudgetAlert = overview.operationalAlerts.find((alert) => alert.id === 'pending-budgets');

    expect(pendingBudgetAlert).toEqual(
      expect.objectContaining({
        metric: '1 pendente(s)',
        description: expect.stringContaining('Jhonta aguarda aprovação há '),
        actionLabel: 'Ver pendência',
        actionTo: '/app/orcamentos?status=PENDENTE',
      }),
    );
  });
});
