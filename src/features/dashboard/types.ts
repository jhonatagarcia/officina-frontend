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
  actionLabel?: string;
  actionTo?: string;
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
  financial: {
    monthRevenue: number;
    stockOutValue: number;
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
  activeServiceOrders: ServiceOrder[];
  pendingBudgets: Budget[];
  operationalAlerts: DashboardOperationalAlert[];
}
