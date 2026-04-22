export type ServiceOrderStatus =
  | 'ABERTA'
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
  client?: ServiceOrderClientSummary;
  vehicle?: ServiceOrderVehicleSummary;
  mechanic?: ServiceOrderMechanicSummary | null;
  parts?: ServiceOrderPart[];
}

export interface ServiceOrderClientSummary {
  id: string;
  name: string;
  document: string | null;
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
  email: string;
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
