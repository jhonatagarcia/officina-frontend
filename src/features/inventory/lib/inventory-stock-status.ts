import type { InventoryItem } from '@/features/inventory/types';

export function getInventoryStatus(
  quantity: number,
  minimumQuantity: number,
): InventoryItem['status'] {
  if (quantity <= minimumQuantity) return 'CRITICO';
  if (quantity <= minimumQuantity * 1.5) return 'BAIXO';
  return 'OK';
}
