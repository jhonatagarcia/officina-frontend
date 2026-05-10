import type { ServiceOrder } from '@/features/service-orders/types';

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

export function getAppliedServiceOrderParts(order: ServiceOrder): AppliedServiceOrderPart[] {
  const appliedBudgetParts = (order.budgetItems ?? []).filter(
    (item) => (item.type === 'PART' || item.type === 'LABOR_AND_PART') && item.inventoryItem,
  );

  return order.parts?.length
    ? order.parts.map((part) => ({
        id: part.id,
        quantity: part.quantity,
        unitPrice: part.unitPrice,
        totalPrice: part.totalPrice,
        inventoryItem: part.inventoryItem,
      }))
    : appliedBudgetParts.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        inventoryItem: item.inventoryItem!,
      }));
}
