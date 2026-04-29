import { http } from '@/services/api/http';
import { buildQueryParams, mapPaginatedResponse } from '@/services/api/query-string';
import type { ApiPaginatedResponse, PaginatedResponse, QueryParams } from '@/types/common';
import { getInventoryStatus } from '@/features/inventory/lib/inventory-stock-status';
import type { InventoryItem } from '@/features/inventory/types';
import { toNumber } from '@/lib/utils';

interface InventoryItemApiResponse extends Omit<InventoryItem, 'cost' | 'salePrice' | 'status'> {
  cost: number | string;
  salePrice: number | string;
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

export const inventoryService = {
  async list(params: QueryParams) {
    const response = await http.get<ApiPaginatedResponse<InventoryItemApiResponse>>('/inventory', {
      params: buildQueryParams(params),
    });

    return mapPaginatedResponse({
      ...response.data,
      data: response.data.data.map(mapInventoryItem),
    }) as PaginatedResponse<InventoryItem>;
  },
  async getById(id: string) {
    const response = await http.get<InventoryItemApiResponse>(`/inventory/${id}`);
    return mapInventoryItem(response.data);
  },
  async getLowStockAlerts() {
    const response = await http.get<InventoryItemApiResponse[]>('/inventory/alerts/low-stock');
    return response.data.map(mapInventoryItem);
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
