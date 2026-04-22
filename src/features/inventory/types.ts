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
