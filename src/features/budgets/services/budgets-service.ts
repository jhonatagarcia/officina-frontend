import { http } from '@/services/api/http';
import { buildQueryParams, mapPaginatedResponse } from '@/services/api/query-string';
import type { ApiPaginatedResponse, PaginatedResponse, QueryParams } from '@/types/common';
import type { Budget, BudgetItem, BudgetItemType } from '@/features/budgets/types';
import { toNumber } from '@/lib/utils';

interface BudgetItemApiResponse {
  id: string;
  budgetId: string;
  type: BudgetItemType;
  description: string;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
  createdAt: string;
  updatedAt: string;
}

interface BudgetApiResponse {
  id: string;
  code: string;
  clientId: string;
  vehicleId: string;
  status: Budget['status'];
  problemDescription: string;
  notes: string | null;
  subtotal: number | string;
  discount: number | string;
  total: number | string;
  convertedToServiceOrder: boolean;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: BudgetItemApiResponse[];
  client?: Budget['client'];
  vehicle?: Budget['vehicle'];
  serviceOrder?: Budget['serviceOrder'] | null;
}

function mapBudgetItem(item: BudgetItemApiResponse): BudgetItem {
  return {
    ...item,
    unitPrice: toNumber(item.unitPrice),
    totalPrice: toNumber(item.totalPrice),
  };
}

function mapBudget(budget: BudgetApiResponse): Budget {
  return {
    ...budget,
    subtotal: toNumber(budget.subtotal),
    discount: toNumber(budget.discount),
    total: toNumber(budget.total),
    items: budget.items.map(mapBudgetItem),
  };
}

export const budgetsService = {
  async list(params: QueryParams) {
    const response = await http.get<ApiPaginatedResponse<BudgetApiResponse>>('/budgets', {
      params: buildQueryParams(params),
    });

    return mapPaginatedResponse({
      ...response.data,
      data: response.data.data.map(mapBudget),
    }) as PaginatedResponse<Budget>;
  },
  async getById(id: string) {
    const response = await http.get<BudgetApiResponse>(`/budgets/${id}`);
    return mapBudget(response.data);
  },
  async create(payload: {
    clientId: string;
    vehicleId: string;
    problemDescription: string;
    notes?: string;
    discount: number;
    items: Array<{ type: BudgetItemType; description: string; quantity: number; unitPrice: number }>;
  }) {
    const response = await http.post<BudgetApiResponse>('/budgets', payload);
    return mapBudget(response.data);
  },
  async approve(id: string) {
    const response = await http.patch<BudgetApiResponse>(`/budgets/${id}/approve`);
    return mapBudget(response.data);
  },
  async reject(id: string) {
    const response = await http.patch<BudgetApiResponse>(`/budgets/${id}/reject`);
    return mapBudget(response.data);
  },
  async convert(id: string) {
    const response = await http.post(`/budgets/${id}/convert-to-service-order`);
    return response.data;
  },
};
