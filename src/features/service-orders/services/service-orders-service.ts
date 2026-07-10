import { http } from '@/services/api/http';
import { buildQueryParams, mapPaginatedResponse } from '@/services/api/query-string';
import type { ApiPaginatedResponse, QueryParams } from '@/types/common';
import type {
  CreateServiceOrderPendingPartPayload,
  AddServiceOrderServicePayload,
  ServiceOrder,
  ServiceOrderBudgetItem,
  ServiceOrderPart,
  ServiceOrderPendingPart,
  ServiceOrderStatus,
  UpdateServiceOrderPendingPartPayload,
  UpdateServiceOrderItemPayload,
} from '@/features/service-orders/types';
import { formatPlate, toNumber } from '@/lib/utils';

interface ServiceOrderPartApiResponse extends Omit<ServiceOrderPart, 'unitPrice' | 'totalPrice'> {
  unitPrice: number | string;
  totalPrice: number | string;
}

interface ServiceOrderBudgetItemApiResponse
  extends Omit<ServiceOrderBudgetItem, 'unitPrice' | 'totalPrice' | 'inventoryItem'> {
  unitPrice: number | string;
  totalPrice: number | string;
  inventoryItem?: ServiceOrderBudgetItem['inventoryItem'] | undefined;
}

interface ServiceOrderPendingPartApiResponse
  extends Omit<ServiceOrderPendingPart, 'quantityRequired' | 'quantityAvailable' | 'inventoryItem'> {
  quantityRequired: number | string;
  quantityAvailable: number | string;
  inventoryItem: Omit<ServiceOrderPendingPart['inventoryItem'], 'quantity'> & {
    quantity: number | string;
  };
}

interface ServiceOrderApiResponse
  extends Omit<
    ServiceOrder,
    | 'clientName'
    | 'vehicleLabel'
    | 'mechanicName'
    | 'parts'
    | 'budgetItems'
    | 'executionItems'
    | 'pendingParts'
    | 'partsTotal'
    | 'laborTotal'
    | 'discount'
    | 'total'
  > {
  partsTotal?: number | string | undefined;
  laborTotal?: number | string | undefined;
  discount?: number | string | undefined;
  total?: number | string | undefined;
  budgetItems?: ServiceOrderBudgetItemApiResponse[] | undefined;
  executionItems?: ServiceOrderBudgetItemApiResponse[] | undefined;
  client?: ServiceOrder['client'] | undefined;
  vehicle?: ServiceOrder['vehicle'] | undefined;
  mechanic?: ServiceOrder['mechanic'] | null | undefined;
  parts?: ServiceOrderPartApiResponse[] | undefined;
  pendingParts?: ServiceOrderPendingPartApiResponse[] | undefined;
  budget?: {
    items?: ServiceOrderBudgetItemApiResponse[] | undefined;
  } | null;
}

function mapServiceOrderPart(part: ServiceOrderPartApiResponse): ServiceOrderPart {
  return {
    ...part,
    unitPrice: toNumber(part.unitPrice),
    totalPrice: toNumber(part.totalPrice),
  };
}

function mapServiceOrderBudgetItem(item: ServiceOrderBudgetItemApiResponse): ServiceOrderBudgetItem {
  return {
    ...item,
    unitPrice: toNumber(item.unitPrice),
    totalPrice: toNumber(item.totalPrice),
    inventoryItem: item.inventoryItem ?? null,
  };
}

function mapServiceOrderPendingPart(part: ServiceOrderPendingPartApiResponse): ServiceOrderPendingPart {
  return {
    ...part,
    quantityRequired: toNumber(part.quantityRequired),
    quantityAvailable: toNumber(part.quantityAvailable),
    inventoryItem: {
      ...part.inventoryItem,
      quantity: toNumber(part.inventoryItem.quantity),
    },
  };
}

function mapServiceOrder(order: ServiceOrderApiResponse): ServiceOrder {
  return {
    ...order,
    clientName: order.client?.name ?? '-',
    vehicleLabel: order.vehicle ? `${formatPlate(order.vehicle.plate)} • ${order.vehicle.brand} ${order.vehicle.model}` : '-',
    mechanicName: order.mechanic?.name ?? null,
    partsTotal: order.partsTotal !== undefined ? toNumber(order.partsTotal) : undefined,
    laborTotal: order.laborTotal !== undefined ? toNumber(order.laborTotal) : undefined,
    discount: order.discount !== undefined ? toNumber(order.discount) : undefined,
    total: order.total !== undefined ? toNumber(order.total) : undefined,
    budgetItems: (order.budgetItems ?? order.budget?.items)?.map(mapServiceOrderBudgetItem),
    executionItems: order.executionItems?.map(mapServiceOrderBudgetItem),
    parts: order.parts?.map(mapServiceOrderPart),
    pendingParts: order.pendingParts?.map(mapServiceOrderPendingPart),
  };
}

export const serviceOrdersService = {
  async list(params: QueryParams) {
    const response = await http.get<ApiPaginatedResponse<ServiceOrderApiResponse>>('/service-orders', {
      params: buildQueryParams(params),
    });

    return mapPaginatedResponse({
      ...response.data,
      data: response.data.data.map(mapServiceOrder),
    });
  },
  async getById(id: string) {
    const response = await http.get<ServiceOrderApiResponse>(`/service-orders/${id}`);
    return mapServiceOrder(response.data);
  },
  async updateStatus(id: string, status: ServiceOrderStatus) {
    const response = await http.patch<ServiceOrderApiResponse>(`/service-orders/${id}/status`, { status });
    return mapServiceOrder(response.data);
  },
  async resumeAfterPartsArrival(id: string) {
    const response = await http.post<ServiceOrderApiResponse>(`/service-orders/${id}/resume-after-parts-arrival`);
    return mapServiceOrder(response.data);
  },
  async update(id: string, payload: Partial<ServiceOrder>) {
    const response = await http.patch<ServiceOrderApiResponse>(`/service-orders/${id}`, payload);
    return mapServiceOrder(response.data);
  },
  async listPendingParts(id: string) {
    const response = await http.get<ServiceOrderPendingPartApiResponse[]>(`/service-orders/${id}/pending-parts`);
    return response.data.map(mapServiceOrderPendingPart);
  },
  async createPendingPart(id: string, payload: CreateServiceOrderPendingPartPayload) {
    const response = await http.post<ServiceOrderPendingPartApiResponse>(`/service-orders/${id}/pending-parts`, payload);
    return mapServiceOrderPendingPart(response.data);
  },
  async updatePendingPart(id: string, pendingPartId: string, payload: UpdateServiceOrderPendingPartPayload) {
    const response = await http.patch<ServiceOrderPendingPartApiResponse>(
      `/service-orders/${id}/pending-parts/${pendingPartId}`,
      payload,
    );
    return mapServiceOrderPendingPart(response.data);
  },
  async cancelPendingPart(id: string, pendingPartId: string) {
    const response = await http.delete<ServiceOrderPendingPartApiResponse | null>(
      `/service-orders/${id}/pending-parts/${pendingPartId}`,
    );
    return response.data ? mapServiceOrderPendingPart(response.data) : null;
  },
  async listParts(id: string) {
    const response = await http.get<ServiceOrderPartApiResponse[]>(`/service-orders/${id}/parts`);
    return response.data.map(mapServiceOrderPart);
  },
  async addPart(id: string, payload: { inventoryItemId: string; quantity: number; unitPrice: number }) {
    const response = await http.post<ServiceOrderPartApiResponse>(`/service-orders/${id}/parts`, payload);
    return mapServiceOrderPart(response.data);
  },
  async addService(id: string, payload: AddServiceOrderServicePayload) {
    const response = await http.post<ServiceOrderBudgetItemApiResponse>(`/service-orders/${id}/services`, payload);
    return mapServiceOrderBudgetItem(response.data);
  },
  async removePart(id: string, partId: string) {
    const response = await http.delete<ServiceOrderPartApiResponse>(`/service-orders/${id}/parts/${partId}`);
    return mapServiceOrderPart(response.data);
  },
  async updateItem(id: string, itemId: string, payload: UpdateServiceOrderItemPayload) {
    const response = await http.patch<ServiceOrderBudgetItemApiResponse>(
      `/service-orders/${id}/items/${itemId}`,
      payload,
    );
    return mapServiceOrderBudgetItem(response.data);
  },
  async removeItem(id: string, itemId: string) {
    const response = await http.delete<ServiceOrderBudgetItemApiResponse>(
      `/service-orders/${id}/items/${itemId}`,
    );
    return mapServiceOrderBudgetItem(response.data);
  },
};
