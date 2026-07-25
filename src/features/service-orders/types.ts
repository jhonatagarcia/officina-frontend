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
  // TODO(WhatsApp Cloud API): reativar com o contrato de notificacao do backend.
  // whatsappNotification?: ServiceOrderWhatsAppNotification | undefined;
  partsTotal?: number | undefined;
  laborTotal?: number | undefined;
  discount?: number | undefined;
  total?: number | undefined;
  client?: ServiceOrderClientSummary | undefined;
  vehicle?: ServiceOrderVehicleSummary | undefined;
  mechanic?: ServiceOrderMechanicSummary | null | undefined;
  budgetItems?: ServiceOrderBudgetItem[] | undefined;
  executionItems?: ServiceOrderBudgetItem[] | undefined;
  executionItemsMaterialized?: boolean | undefined;
  parts?: ServiceOrderPart[] | undefined;
  pendingParts?: ServiceOrderPendingPart[] | undefined;
}

/*
 * TODO(WhatsApp Cloud API): contrato preservado para a retomada da feature.
 * export interface ServiceOrderWhatsAppNotification {
 *   status: 'SENT' | 'SKIPPED' | 'FAILED';
 *   reason?: string | undefined;
 * }
 */

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
  note?: string | null | undefined;
  expectedArrivalAt?: string | null | undefined;
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

export interface AddServiceOrderServicePayload {
  serviceCatalogItemId: string;
  inventoryItemId?: string | null | undefined;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface ServiceOrderBudgetItem {
  id: string;
  type: 'PART' | 'LABOR' | 'LABOR_AND_PART';
  serviceCatalogItemId?: string | null | undefined;
  inventoryItemId: string | null;
  serviceCode: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  laborUnitPrice?: number | undefined;
  laborTotalPrice?: number | undefined;
  partUnitPrice?: number | undefined;
  partTotalPrice?: number | undefined;
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
