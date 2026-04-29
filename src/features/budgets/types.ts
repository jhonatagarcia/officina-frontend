export type BudgetStatus = 'PENDENTE' | 'APROVADO' | 'REPROVADO';
export type BudgetItemType = 'PART' | 'LABOR' | 'LABOR_AND_PART';

export interface BudgetItem {
  id: string;
  budgetId: string;
  type: BudgetItemType;
  serviceCatalogItemId: string | null;
  inventoryItemId: string | null;
  serviceCode: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  code: string;
  clientId: string;
  vehicleId: string;
  status: BudgetStatus;
  problemDescription: string;
  notes: string | null;
  subtotal: number;
  discount: number;
  total: number;
  convertedToServiceOrder: boolean;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: BudgetItem[];
  client?: BudgetClientSummary;
  vehicle?: BudgetVehicleSummary;
  serviceOrder?: BudgetServiceOrderSummary | null;
}

export interface BudgetClientSummary {
  id: string;
  name: string;
  document: string | null;
}

export interface BudgetVehicleSummary {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
}

export interface BudgetServiceOrderSummary {
  id: string;
  orderNumber: string;
  status: BudgetStatus;
  openedAt: string;
}
