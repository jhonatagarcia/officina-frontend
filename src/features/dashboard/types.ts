import type { Budget } from '@/features/budgets/types';
import type { ServiceOrder } from '@/features/service-orders/types';

export type DashboardAlertSeverity = 'danger' | 'warning' | 'info';
export type DashboardPeriod = 'WEEK' | 'MONTH' | 'BIMESTER' | 'TRIMESTER' | 'YEAR';

export interface DashboardOperationalAlert {
  id: string;
  severity: DashboardAlertSeverity;
  title: string;
  description: string;
  metric: string;
  actionLabel?: string | undefined;
  actionTo?: string | undefined;
}

export interface DashboardOverview {
  serviceOrders: {
    open: number;
    inProgress: number;
    readyForDelivery: number;
  };
  budgets: {
    pending: number;
  };
  clients: {
    total: number;
    new: number;
    returnRate: number;
  };
  financial: {
    monthRevenue: number;
    stockOutValue: number;
    receivablesValue: number;
    averageTicket: number;
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
  operational: {
    averageExecutionDays: number;
  };
  activeServiceOrders: ServiceOrder[];
  pendingBudgets: Budget[];
  operationalAlerts: DashboardOperationalAlert[];
}
