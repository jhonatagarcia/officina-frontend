import type { ServiceOrder, ServiceOrderBudgetItem } from '@/features/service-orders/types';
import { getEditableServiceOrderItems } from '@/features/service-orders/lib/service-order-details';

export type AppliedServiceOrderPart = {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  inventoryItem: {
    id: string;
    name: string;
    internalCode: string;
  };
};

function hasPlannedInventoryPart(
  item: ServiceOrderBudgetItem,
): item is ServiceOrderBudgetItem & { inventoryItem: NonNullable<ServiceOrderBudgetItem['inventoryItem']> } {
  return (item.type === 'PART' || item.type === 'LABOR_AND_PART') && item.inventoryItem !== null;
}

export function getPlannedServiceOrderParts(order: ServiceOrder): AppliedServiceOrderPart[] {
  const editableItems = getEditableServiceOrderItems(order);

  return editableItems.filter(hasPlannedInventoryPart).map((item) => ({
    id: item.id,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    inventoryItem: item.inventoryItem,
  }));
}

export function getAppliedServiceOrderParts(order: ServiceOrder): AppliedServiceOrderPart[] {
  return (order.parts ?? []).map((part) => ({
    id: part.id,
    quantity: part.quantity,
    unitPrice: part.unitPrice,
    totalPrice: part.totalPrice,
    inventoryItem: part.inventoryItem,
  }));
}
