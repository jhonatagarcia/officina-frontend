import { http } from '@/services/api/http';
import { buildQueryParams, mapPaginatedResponse } from '@/services/api/query-string';
import type { ApiPaginatedResponse, QueryParams } from '@/types/common';
import type { ServiceOrder, ServiceOrderBudgetItem, ServiceOrderPart, ServiceOrderStatus } from '@/features/service-orders/types';
import { toNumber } from '@/lib/utils';

interface ServiceOrderPartApiResponse extends Omit<ServiceOrderPart, 'unitPrice' | 'totalPrice'> {
  unitPrice: number | string;
  totalPrice: number | string;
}

interface ServiceOrderBudgetItemApiResponse
  extends Omit<ServiceOrderBudgetItem, 'unitPrice' | 'totalPrice'> {
  unitPrice: number | string;
  totalPrice: number | string;
}

interface ServiceOrderApiResponse
  extends Omit<
    ServiceOrder,
    'clientName' | 'vehicleLabel' | 'mechanicName' | 'parts' | 'budgetItems' | 'partsTotal' | 'laborTotal' | 'discount' | 'total'
  > {
  partsTotal?: number | string;
  laborTotal?: number | string;
  discount?: number | string;
  total?: number | string;
  budgetItems?: ServiceOrderBudgetItemApiResponse[];
  client?: ServiceOrder['client'];
  vehicle?: ServiceOrder['vehicle'];
  mechanic?: ServiceOrder['mechanic'] | null;
  parts?: ServiceOrderPartApiResponse[];
  budget?: {
    items?: ServiceOrderBudgetItemApiResponse[];
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
  };
}

function mapServiceOrder(order: ServiceOrderApiResponse): ServiceOrder {
  return {
    ...order,
    clientName: order.client?.name ?? '-',
    vehicleLabel: order.vehicle ? `${order.vehicle.plate} • ${order.vehicle.brand} ${order.vehicle.model}` : '-',
    mechanicName: order.mechanic?.name ?? null,
    partsTotal: order.partsTotal !== undefined ? toNumber(order.partsTotal) : undefined,
    laborTotal: order.laborTotal !== undefined ? toNumber(order.laborTotal) : undefined,
    discount: order.discount !== undefined ? toNumber(order.discount) : undefined,
    total: order.total !== undefined ? toNumber(order.total) : undefined,
    budgetItems: (order.budgetItems ?? order.budget?.items)?.map(mapServiceOrderBudgetItem),
    parts: order.parts?.map(mapServiceOrderPart),
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
  async update(id: string, payload: Partial<ServiceOrder>) {
    const response = await http.patch<ServiceOrderApiResponse>(`/service-orders/${id}`, payload);
    return mapServiceOrder(response.data);
  },
  async listParts(id: string) {
    const response = await http.get<ServiceOrderPartApiResponse[]>(`/service-orders/${id}/parts`);
    return response.data.map(mapServiceOrderPart);
  },
  async addPart(id: string, payload: { inventoryItemId: string; quantity: number; unitPrice: number }) {
    const response = await http.post<ServiceOrderPartApiResponse>(`/service-orders/${id}/parts`, payload);
    return mapServiceOrderPart(response.data);
  },
};
