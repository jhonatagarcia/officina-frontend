import type { ServiceOrderStatus } from '@/features/service-orders/types';

export type InventoryStatus = 'OK' | 'BAIXO' | 'CRITICO';

export interface InventoryItem {
  id: string;
  name: string;
  internalCode: string;
  category: string | null;
  supplier: string | null;
  quantity: number;
  minimumQuantity: number;
  cost: number;
  salePrice: number;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RelatedPendingServiceOrderSuggestion {
  serviceOrderId: string;
  orderNumber: string;
  clientName: string;
  vehiclePlate: string;
  pendingPartId: string;
  inventoryItemId: string;
  quantityRequired: number;
  quantityAvailable: number;
  status: string;
  serviceOrderStatus?: ServiceOrderStatus;
  suggestedAction: 'RESUME_SERVICE_ORDER';
}

export interface RelatedPendingServiceOrders {
  count: number;
  items: RelatedPendingServiceOrderSuggestion[];
}

export interface InventoryItemSaveResult {
  item: InventoryItem;
  relatedPendingServiceOrders?: RelatedPendingServiceOrders;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  serviceOrderId: string | null;
  serviceOrderPartId: string | null;
  type: 'OUT' | 'ADJUSTMENT';
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  unitCost: number | null;
  totalCost: number | null;
  reason: string | null;
  createdAt: string;
  serviceOrder: {
    id: string;
    orderNumber: string;
    status: string;
    client: {
      id: string;
      name: string;
    };
  } | null;
}
