import type { Budget } from '@/features/budgets/types';
import { budgetsService } from '@/features/budgets/services/budgets-service';
import type { DashboardOperationalAlert, DashboardOverview } from '@/features/dashboard/types';
import { inventoryService } from '@/features/inventory/services/inventory-service';
import type { InventoryItem } from '@/features/inventory/types';
import type { ServiceOrder } from '@/features/service-orders/types';
import { serviceOrdersService } from '@/features/service-orders/services/service-orders-service';
import { formatServiceOrderNumber, toNumber } from '@/lib/utils';
import { http } from '@/services/api/http';

interface DashboardSummaryApiResponse {
  serviceOrders: {
    open: number;
    inProgress: number;
    readyForDelivery: number;
  };
  budgets: {
    pending: number;
  };
  financial: {
    monthRevenue: number | string;
  };
  inventory: {
    lowStockCount: number;
    lowStockItems: {
      id: string;
      name: string;
      quantity: number;
      minimumQuantity: number;
      internalCode: string;
    }[];
  };
}

function mapDashboardSummary(response: DashboardSummaryApiResponse): Omit<DashboardOverview, 'operationalAlerts'> {
  return {
    serviceOrders: response.serviceOrders,
    budgets: response.budgets,
    financial: {
      monthRevenue: toNumber(response.financial.monthRevenue),
    },
    inventory: response.inventory,
  };
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function differenceInDays(date: string) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return null;

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((startOfToday().getTime() - parsedDate.getTime()) / msPerDay);
}

function describeOldestBudget(budget: Budget | undefined) {
  if (!budget) return '';

  const age = differenceInDays(budget.createdAt);
  const clientName = budget.client?.name?.trim() || budget.code;

  if (age === null || age <= 0) {
    return `${clientName} entrou hoje na fila de aprovação.`;
  }

  if (age === 1) {
    return `${clientName} aguarda aprovação há 1 dia.`;
  }

  return `${clientName} aguarda aprovação há ${age} dias.`;
}

function describeCriticalItems(items: InventoryItem[]) {
  return items
    .slice(0, 2)
    .map((item) => `${item.name} (${item.quantity}/${item.minimumQuantity})`)
    .join(', ');
}

function buildOperationalAlerts(params: {
  summary: Omit<DashboardOverview, 'operationalAlerts'>;
  lowStockItems: InventoryItem[];
  activeServiceOrders: ServiceOrder[];
  pendingBudgets: Budget[];
}): DashboardOperationalAlert[] {
  const alerts: DashboardOperationalAlert[] = [];
  const pendingBudgets = params.pendingBudgets
    .filter((budget) => budget.status === 'PENDENTE')
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
  const criticalStockItems = params.lowStockItems.filter((item) => item.status === 'CRITICO');
  const overdueOrders = params.activeServiceOrders.filter((order) => {
    if (!order.expectedDeliveryAt) return false;

    const expectedDelivery = new Date(order.expectedDeliveryAt);
    return !Number.isNaN(expectedDelivery.getTime()) && expectedDelivery < startOfToday();
  });

  if (criticalStockItems.length > 0) {
    const highlightedItems = describeCriticalItems(criticalStockItems);

    alerts.push({
      id: 'critical-stock',
      severity: 'danger',
      title: 'Reposição imediata de estoque',
      metric: `${criticalStockItems.length} item(ns) crítico(s)`,
      description: highlightedItems
        ? `${highlightedItems}${criticalStockItems.length > 2 ? ' e outros itens zerados.' : ' precisam de reposição imediata.'}`
        : 'Existem itens zerados ou abaixo do mínimo operacional.',
    });
  } else if (params.summary.inventory.lowStockCount > 0) {
    alerts.push({
      id: 'low-stock',
      severity: 'warning',
      title: 'Itens abaixo do mínimo',
      metric: `${params.summary.inventory.lowStockCount} item(ns)`,
      description: 'Há itens com saldo abaixo do mínimo configurado e reposição pendente.',
    });
  }

  if (overdueOrders.length > 0) {
    const oldestOrder = overdueOrders
      .slice()
      .sort((left, right) => {
        const leftTime = left.expectedDeliveryAt ? new Date(left.expectedDeliveryAt).getTime() : Number.MAX_SAFE_INTEGER;
        const rightTime = right.expectedDeliveryAt ? new Date(right.expectedDeliveryAt).getTime() : Number.MAX_SAFE_INTEGER;
        return leftTime - rightTime;
      })[0];
    const delayDays = oldestOrder?.expectedDeliveryAt ? differenceInDays(oldestOrder.expectedDeliveryAt) : null;

    alerts.push({
      id: 'overdue-service-orders',
      severity: 'danger',
      title: 'Ordens de serviço em atraso',
      metric: `${overdueOrders.length} OS com prazo vencido`,
      description:
        oldestOrder && delayDays !== null
          ? `${formatServiceOrderNumber(oldestOrder.orderNumber)} de ${oldestOrder.clientName} está atrasada há ${Math.max(delayDays, 1)} dia(s).`
          : 'Existem ordens de serviço com prazo de entrega vencido.',
    });
  }

  if (pendingBudgets.length > 0) {
    const oldestPendingBudget = pendingBudgets[0];

    alerts.push({
      id: 'pending-budgets',
      severity: pendingBudgets.length >= 5 ? 'warning' : 'info',
      title: 'Orçamentos aguardando retorno',
      metric: `${pendingBudgets.length} pendente(s)`,
      description: describeOldestBudget(oldestPendingBudget) || 'Existem orçamentos aguardando aprovação do cliente.',
      actionLabel: oldestPendingBudget ? 'Ver pendência' : undefined,
      actionTo: oldestPendingBudget ? '/app/orcamentos?status=PENDENTE' : undefined,
    });
  }

  const activeFlow = params.summary.serviceOrders.open + params.summary.serviceOrders.inProgress;
  if (activeFlow > 0) {
    alerts.push({
      id: 'workshop-flow',
      severity: activeFlow >= 10 ? 'warning' : 'info',
      title: 'Carga operacional em andamento',
      metric: `${activeFlow} veículo(s) em fluxo`,
      description: `${params.summary.serviceOrders.open} OS abertas, ${params.summary.serviceOrders.inProgress} em execução e ${params.summary.serviceOrders.readyForDelivery} prontas para entrega.`,
      actionLabel: 'Ver ordens de serviço',
      actionTo: '/app/ordens-servico',
    });
  }

  return alerts.slice(0, 4);
}

export const dashboardService = {
  async getOverview(): Promise<DashboardOverview> {
    const [summaryResponse, lowStockItems, openOrders, inProgressOrders, pendingBudgets] = await Promise.all([
      http.get<DashboardSummaryApiResponse>('/dashboard/summary'),
      inventoryService.getLowStockAlerts(),
      serviceOrdersService.list({
        page: 1,
        pageSize: 100,
        status: 'ABERTA',
        sortBy: 'openedAt',
        sortOrder: 'asc',
      }),
      serviceOrdersService.list({
        page: 1,
        pageSize: 100,
        status: 'EM_ANDAMENTO',
        sortBy: 'openedAt',
        sortOrder: 'asc',
      }),
      budgetsService.list({
        page: 1,
        pageSize: 5,
        status: 'PENDENTE',
        sortBy: 'createdAt',
        sortOrder: 'asc',
      }),
    ]);

    const summary = mapDashboardSummary(summaryResponse.data);
    const operationalAlerts = buildOperationalAlerts({
      summary,
      lowStockItems,
      activeServiceOrders: [...openOrders.data, ...inProgressOrders.data],
      pendingBudgets: pendingBudgets.data,
    });

    return {
      ...summary,
      operationalAlerts,
    };
  },
};
