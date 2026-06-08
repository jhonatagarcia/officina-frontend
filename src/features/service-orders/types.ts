export type ServiceOrderStatus =
  | 'ABERTA'
  | 'AGUARDANDO_PECA'
  | 'EM_ANDAMENTO'
  | 'FINALIZADA'
  | 'ENTREGUE';

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  budgetId: string | null;
  clientId: string;
  vehicleId: string;
  mechanicId: string | null;
  clientName: string;
  vehicleLabel: string;
  mechanicName: string | null;
  problemDescription: string;
  diagnosis: string | null;
  servicesPerformed: string | null;
  vehicleChecklist: string | null;
  openedAt: string;
  expectedDeliveryAt: string | null;
  finishedAt: string | null;
  deliveredAt: string | null;
  status: ServiceOrderStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  whatsappNotification?: ServiceOrderWhatsAppNotification;
  partsTotal?: number;
  laborTotal?: number;
  discount?: number;
  total?: number;
  client?: ServiceOrderClientSummary;
  vehicle?: ServiceOrderVehicleSummary;
  mechanic?: ServiceOrderMechanicSummary | null;
  budgetItems?: ServiceOrderBudgetItem[];
  executionItems?: ServiceOrderBudgetItem[];
  executionItemsMaterialized?: boolean;
  parts?: ServiceOrderPart[];
  pendingParts?: ServiceOrderPendingPart[];
}

export interface ServiceOrderWhatsAppNotification {
  status: 'SENT' | 'SKIPPED' | 'FAILED';
  reason?: string;
}

export type PendingPartStatus =
  | 'PENDING'
  | 'PARTIALLY_AVAILABLE'
  | 'AVAILABLE'
  | 'RESOLVED'
  | 'CANCELED';

export interface ServiceOrderPendingPart {
  id: string;
  serviceOrderId: string;
  inventoryItemId: string;
  quantityRequired: number;
  quantityAvailable: number;
  status: PendingPartStatus;
  note: string | null;
  expectedArrivalAt: string | null;
  resolvedAt: string | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
  inventoryItem: {
    id: string;
    name: string;
    internalCode: string;
    quantity: number;
  };
}

export interface CreateServiceOrderPendingPartPayload {
  inventoryItemId: string;
  quantityRequired: number;
  note?: string | null;
  expectedArrivalAt?: string | null;
}

export type UpdateServiceOrderPendingPartPayload =
  Partial<CreateServiceOrderPendingPartPayload>;

export type UpdateServiceOrderItemPayload = Pick<
  ServiceOrderBudgetItem,
  | 'type'
  | 'serviceCatalogItemId'
  | 'inventoryItemId'
  | 'description'
  | 'quantity'
  | 'unitPrice'
>;

export interface ServiceOrderBudgetItem {
  id: string;
  type: 'PART' | 'LABOR' | 'LABOR_AND_PART';
  serviceCatalogItemId?: string | null;
  inventoryItemId: string | null;
  serviceCode: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  inventoryItem: {
    id: string;
    name: string;
    internalCode: string;
  } | null;
}

export interface ServiceOrderClientSummary {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
}

export interface ServiceOrderVehicleSummary {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
}

export interface ServiceOrderMechanicSummary {
  id: string;
  name: string;
  role: string;
}

export interface ServiceOrderPart {
  id: string;
  serviceOrderId: string;
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  inventoryItem: {
    id: string;
    name: string;
    internalCode: string;
  };
}
