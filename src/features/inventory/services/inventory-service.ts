import { http } from '@/services/api/http';
import { buildQueryParams, mapPaginatedResponse } from '@/services/api/query-string';
import type { ApiPaginatedResponse, QueryParams } from '@/types/common';
import { getInventoryStatus } from '@/features/inventory/lib/inventory-stock-status';
import type { InventoryItem, InventoryMovement } from '@/features/inventory/types';
import { toNumber } from '@/lib/utils';

interface InventoryItemApiResponse extends Omit<InventoryItem, 'cost' | 'salePrice' | 'status'> {
  cost: number | string;
  salePrice: number | string;
}

interface InventoryMovementApiResponse extends Omit<InventoryMovement, 'unitCost' | 'totalCost'> {
  unitCost: number | string | null;
  totalCost: number | string | null;
}

function mapInventoryItem(item: InventoryItemApiResponse): InventoryItem {
  const cost = toNumber(item.cost);
  const salePrice = toNumber(item.salePrice);

  return {
    ...item,
    cost,
    salePrice,
    status: getInventoryStatus(item.quantity, item.minimumQuantity),
  };
}

function mapInventoryMovement(movement: InventoryMovementApiResponse): InventoryMovement {
  return {
    ...movement,
    unitCost: movement.unitCost === null ? null : toNumber(movement.unitCost),
    totalCost: movement.totalCost === null ? null : toNumber(movement.totalCost),
  };
}

export const inventoryService = {
  async list(params: QueryParams) {
    const response = await http.get<ApiPaginatedResponse<InventoryItemApiResponse>>('/inventory', {
      params: buildQueryParams(params),
    });

    return mapPaginatedResponse({
      ...response.data,
      data: response.data.data.map(mapInventoryItem),
    });
  },
  async getById(id: string) {
    const response = await http.get<InventoryItemApiResponse>(`/inventory/${id}`);
    return mapInventoryItem(response.data);
  },
  async getLowStockAlerts() {
    const response = await http.get<InventoryItemApiResponse[]>('/inventory/alerts/low-stock');
    return response.data.map(mapInventoryItem);
  },
  async getMovements(id: string) {
    const response = await http.get<InventoryMovementApiResponse[]>(`/inventory/${id}/movements`);
    return response.data.map(mapInventoryMovement);
  },
  async create(payload: Pick<InventoryItem, 'name' | 'category' | 'supplier' | 'quantity' | 'minimumQuantity' | 'cost' | 'salePrice'> & { internalCode?: string }) {
    const response = await http.post<InventoryItemApiResponse>('/inventory', payload);
    return mapInventoryItem(response.data);
  },
  async update(id: string, payload: Partial<InventoryItem>) {
    const response = await http.patch<InventoryItemApiResponse>(`/inventory/${id}`, payload);
    return mapInventoryItem(response.data);
  },
};
