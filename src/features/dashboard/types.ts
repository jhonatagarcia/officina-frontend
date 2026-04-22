export type DashboardAlertSeverity = 'danger' | 'warning' | 'info';

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
  operationalAlerts: DashboardOperationalAlert[];
}
