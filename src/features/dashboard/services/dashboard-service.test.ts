import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Budget } from '@/features/budgets/types';
import { budgetsService } from '@/features/budgets/services/budgets-service';
import { dashboardService } from '@/features/dashboard/services/dashboard-service';
import type { InventoryItem } from '@/features/inventory/types';
import { inventoryService } from '@/features/inventory/services/inventory-service';
import type { ServiceOrder } from '@/features/service-orders/types';
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

const emptySummary = {
  serviceOrders: {
    open: 0,
    inProgress: 0,
    readyForDelivery: 0,
  },
  budgets: {
    pending: 0,
  },
  clients: {
    total: 0,
    new: 0,
    returnRate: 0,
  },
  financial: {
    monthRevenue: '0',
    stockOutValue: '0',
    pendingServiceOrderPaymentsValue: '0',
    averageTicket: '0',
  },
  inventory: {
    lowStockCount: 0,
    lowStockItems: [],
  },
  operational: {
    averageExecutionDays: '0',
  },
};

function mockSummary(summary: typeof emptySummary = emptySummary) {
  vi.mocked(http.get).mockResolvedValueOnce({
    data: summary,
  });
}

function paginatedResponse<T>(data: T[], pageSize = 100) {
  return {
    data,
    page: 1,
    pageSize,
    total: data.length,
    totalPages: 1,
  };
}

function mockLists(params: {
  lowStockItems?: InventoryItem[];
  openOrders?: ServiceOrder[];
  inProgressOrders?: ServiceOrder[];
  pendingBudgets?: Budget[];
}) {
  vi.mocked(inventoryService.getLowStockAlerts).mockResolvedValueOnce(params.lowStockItems ?? []);
  vi.mocked(serviceOrdersService.list)
    .mockResolvedValueOnce(paginatedResponse(params.openOrders ?? []))
    .mockResolvedValueOnce(paginatedResponse(params.inProgressOrders ?? []));
  vi.mocked(budgetsService.list).mockResolvedValueOnce(paginatedResponse(params.pendingBudgets ?? [], 5));
}

function makeInventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'inv-1',
    name: 'Filtro de oleo',
    internalCode: 'FO-01',
    category: 'Lubrificacao',
    supplier: 'Fornecedor A',
    quantity: 0,
    minimumQuantity: 2,
    cost: 10,
    salePrice: 20,
    status: 'CRITICO',
    createdAt: '2026-04-10T00:00:00.000Z',
    updatedAt: '2026-04-10T00:00:00.000Z',
    ...overrides,
  };
}

function makeServiceOrder(overrides: Partial<ServiceOrder> = {}): ServiceOrder {
  return {
    id: 'os-1',
    orderNumber: 'OS-001',
    budgetId: null,
    clientId: 'c-1',
    vehicleId: 'v-1',
    mechanicId: null,
    clientName: 'Carlos Lima',
    vehicleLabel: 'ABC1234 - Fiat Uno',
    mechanicName: null,
    problemDescription: 'Revisao',
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
    ...overrides,
  };
}

function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'budget-1',
    code: 'ORC-001',
    clientId: 'c-1',
    vehicleId: 'v-1',
    status: 'PENDENTE',
    problemDescription: 'Troca de oleo',
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
    ...overrides,
  };
}

describe('dashboardService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-07T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('monta alertas operacionais a partir de dados reais do backend', async () => {
    mockSummary({
      serviceOrders: {
        open: 2,
        inProgress: 3,
        readyForDelivery: 1,
      },
      budgets: {
        pending: 2,
      },
      clients: {
        total: 15,
        new: 4,
        returnRate: 27,
      },
      financial: {
        monthRevenue: '12345.67',
        stockOutValue: '890.25',
        pendingServiceOrderPaymentsValue: '3500.50',
        averageTicket: '4115.22',
      },
      inventory: {
        lowStockCount: 3,
        lowStockItems: [],
      },
      operational: {
        averageExecutionDays: '2.5',
      },
    });
    mockLists({
      lowStockItems: [
        makeInventoryItem({
          name: 'Filtro de oleo',
        }),
      ],
      openOrders: [
        makeServiceOrder({
          orderNumber: 'OS-001',
          expectedDeliveryAt: '2026-04-11T00:00:00.000Z',
        }),
      ],
      pendingBudgets: [
        makeBudget({
          createdAt: '2026-04-12T00:00:00.000Z',
        }),
      ],
    });

    const overview = await dashboardService.getOverview();

    expect(overview.financial.monthRevenue).toBe(12345.67);
    expect(overview.financial.stockOutValue).toBe(890.25);
    expect(overview.financial.pendingServiceOrderPaymentsValue).toBe(3500.5);
    expect(overview.financial.averageTicket).toBe(4115.22);
    expect(overview.clients.total).toBe(15);
    expect(overview.clients.new).toBe(4);
    expect(overview.clients.returnRate).toBe(27);
    expect(overview.operational.averageExecutionDays).toBe(2.5);
    expect(http.get).toHaveBeenCalledWith('/dashboard/summary', {
      params: { period: 'YEAR' },
    });
    expect(serviceOrdersService.list).toHaveBeenNthCalledWith(1, {
      page: 1,
      pageSize: 100,
      status: 'ABERTA',
      sortBy: 'openedAt',
      sortOrder: 'asc',
    });
    expect(serviceOrdersService.list).toHaveBeenNthCalledWith(2, {
      page: 1,
      pageSize: 100,
      status: 'EM_ANDAMENTO',
      sortBy: 'openedAt',
      sortOrder: 'asc',
    });
    expect(budgetsService.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 100,
      status: 'PENDENTE',
      sortBy: 'createdAt',
      sortOrder: 'asc',
    });
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
          id: 'pending-service-order-payments',
          severity: 'warning',
        }),
        expect.objectContaining({
          id: 'pending-budgets',
        }),
      ]),
    );
  });

  it('envia o periodo selecionado para o resumo do dashboard', async () => {
    mockSummary();
    mockLists({});

    await dashboardService.getOverview('TRIMESTER');

    expect(http.get).toHaveBeenCalledWith('/dashboard/summary', {
      params: { period: 'TRIMESTER' },
    });
  });

  it('ignora orcamentos aprovados nos alertas operacionais e usa o nome do cliente do pendente', async () => {
    mockSummary({
      ...emptySummary,
      budgets: {
        pending: 1,
      },
    });
    mockLists({
      pendingBudgets: [
        makeBudget({
          id: 'budget-approved',
          code: 'ORC-010',
          status: 'APROVADO',
          approvedAt: '2026-04-11T00:00:00.000Z',
          createdAt: '2026-04-10T00:00:00.000Z',
          client: {
            id: 'c-10',
            name: 'Edna Regina dos Santos',
            document: null,
          },
        }),
        makeBudget({
          id: 'budget-pending',
          code: 'ORC-011',
          createdAt: '2026-04-12T00:00:00.000Z',
          client: {
            id: 'c-11',
            name: 'Jhonta',
            document: null,
          },
        }),
      ],
    });

    const overview = await dashboardService.getOverview();
    const pendingBudgetAlert = overview.operationalAlerts.find((alert) => alert.id === 'pending-budgets');

    expect(pendingBudgetAlert).toEqual(
      expect.objectContaining({
        metric: '1 pendente(s)',
        description: 'Jhonta aguarda aprovação há 25 dias.',
        actionLabel: 'Ver pendência',
        actionTo: '/inicio/orcamentos?status=PENDENTE',
      }),
    );
  });

  it('usa alerta de estoque baixo quando nao existem itens criticos', async () => {
    mockSummary({
      ...emptySummary,
      inventory: {
        lowStockCount: 2,
        lowStockItems: [],
      },
    });
    mockLists({
      lowStockItems: [
        makeInventoryItem({
          id: 'inv-low',
          status: 'BAIXO',
          quantity: 1,
          minimumQuantity: 3,
        }),
      ],
    });

    const overview = await dashboardService.getOverview();

    expect(overview.operationalAlerts).toEqual([
      expect.objectContaining({
        id: 'low-stock',
        severity: 'warning',
        metric: '2 item(ns)',
      }),
    ]);
  });

  it('ordena orcamentos pendentes pela criacao e limita os alertas a quatro itens', async () => {
    mockSummary({
      ...emptySummary,
      serviceOrders: {
        open: 6,
        inProgress: 5,
        readyForDelivery: 2,
      },
      inventory: {
        lowStockCount: 3,
        lowStockItems: [],
      },
    });
    mockLists({
      lowStockItems: [
        makeInventoryItem({ id: 'inv-1', name: 'Filtro de ar' }),
        makeInventoryItem({ id: 'inv-2', name: 'Vela' }),
        makeInventoryItem({ id: 'inv-3', name: 'Correia' }),
      ],
      openOrders: [
        makeServiceOrder({
          id: 'os-newer',
          orderNumber: 'OS-101',
          expectedDeliveryAt: '2026-05-06T00:00:00.000Z',
        }),
      ],
      inProgressOrders: [
        makeServiceOrder({
          id: 'os-oldest',
          orderNumber: 'OS-050',
          clientName: 'Marina Souza',
          expectedDeliveryAt: '2026-05-01T00:00:00.000Z',
          status: 'EM_ANDAMENTO',
        }),
      ],
      pendingBudgets: [
        makeBudget({
          id: 'budget-newer',
          code: 'ORC-020',
          createdAt: '2026-05-06T00:00:00.000Z',
          client: {
            id: 'c-20',
            name: 'Cliente Recente',
            document: null,
          },
        }),
        makeBudget({
          id: 'budget-oldest',
          code: 'ORC-010',
          createdAt: '2026-05-01T00:00:00.000Z',
          client: {
            id: 'c-10',
            name: 'Cliente Antigo',
            document: null,
          },
        }),
      ],
    });

    const overview = await dashboardService.getOverview();

    expect(overview.operationalAlerts).toHaveLength(4);
    expect(overview.operationalAlerts.map((alert) => alert.id)).toEqual([
      'critical-stock',
      'overdue-service-orders',
      'pending-budgets',
      'workshop-flow',
    ]);
    expect(overview.operationalAlerts.find((alert) => alert.id === 'critical-stock')).toEqual(
      expect.objectContaining({
        description: 'Filtro de ar (0/2), Vela (0/2) e outros itens zerados.',
      }),
    );
    expect(overview.operationalAlerts.find((alert) => alert.id === 'overdue-service-orders')).toEqual(
      expect.objectContaining({
        description: 'OS000050 de Marina Souza está atrasada há 6 dia(s).',
      }),
    );
    expect(overview.operationalAlerts.find((alert) => alert.id === 'pending-budgets')).toEqual(
      expect.objectContaining({
        description: 'Cliente Antigo aguarda aprovação há 6 dias.',
      }),
    );
  });

  it('ignora prazos ausentes ou invalidos ao montar alerta de atraso', async () => {
    mockSummary(emptySummary);
    mockLists({
      openOrders: [
        makeServiceOrder({
          id: 'os-no-date',
          expectedDeliveryAt: null,
        }),
        makeServiceOrder({
          id: 'os-invalid-date',
          expectedDeliveryAt: 'data-invalida',
        }),
      ],
    });

    const overview = await dashboardService.getOverview();

    expect(overview.activeServiceOrders).toHaveLength(2);
    expect(overview.operationalAlerts.find((alert) => alert.id === 'overdue-service-orders')).toBeUndefined();
  });
});
