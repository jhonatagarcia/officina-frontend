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

function isBillablePart(item: ServiceOrderBudgetItem) {
  if (item.type === 'PART') return true;
  return item.type === 'LABOR_AND_PART' && (item.partTotalPrice ?? 0) > 0;
}

export function getPlannedServiceOrderParts(order: ServiceOrder): AppliedServiceOrderPart[] {
  const editableItems = getEditableServiceOrderItems(order);

  return editableItems
    .filter(isBillablePart)
    .map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice:
        item.type === 'LABOR_AND_PART' ? (item.partUnitPrice ?? 0) : item.unitPrice,
      totalPrice:
        item.type === 'LABOR_AND_PART' ? (item.partTotalPrice ?? 0) : item.totalPrice,
      inventoryItem: item.inventoryItem ?? {
        id: item.inventoryItemId ?? item.id,
        name: item.description,
        internalCode: '-',
      },
    }))
    .filter((item) => item.totalPrice > 0);
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
