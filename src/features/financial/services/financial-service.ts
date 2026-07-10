import { http } from '@/services/api/http';
import { buildQueryParams, mapPaginatedResponse } from '@/services/api/query-string';
import type { ApiPaginatedResponse, QueryParams } from '@/types/common';
import type { FinancialEntry, FinancialStatus, FinancialType, PaymentMethod } from '@/features/financial/types';
import { toNumber } from '@/lib/utils';

interface FinancialEntryApiResponse extends Omit<FinancialEntry, 'amount' | 'status' | 'type'> {
  amount: number | string;
  status: string;
  type: string;
}

const financialTypeMap: Record<string, FinancialType> = {
  PAYABLE: 'PAYABLE',
  PAGAR: 'PAYABLE',
  RECEIVABLE: 'RECEIVABLE',
  RECEBER: 'RECEIVABLE',
};

const financialStatusMap: Record<string, FinancialStatus> = {
  OVERDUE: 'VENCIDO',
  PAID: 'PAGO',
  PAGO: 'PAGO',
  PENDENTE: 'VENCIDO',
  PENDING: 'VENCIDO',
  VENCIDO: 'VENCIDO',
};

function normalizeFinancialType(type: string): FinancialType {
  return financialTypeMap[type.toUpperCase()] ?? 'PAYABLE';
}

function normalizeFinancialStatus(status: string): FinancialStatus {
  return financialStatusMap[status.toUpperCase()] ?? 'VENCIDO';
}

function mapFinancialEntry(entry: FinancialEntryApiResponse): FinancialEntry {
  return {
    ...entry,
    amount: toNumber(entry.amount),
    status: normalizeFinancialStatus(entry.status),
    type: normalizeFinancialType(entry.type),
  };
}

export const financialService = {
  async list(params: QueryParams) {
    const response = await http.get<ApiPaginatedResponse<FinancialEntryApiResponse>>('/financial', {
      params: buildQueryParams(params),
    });

    return mapPaginatedResponse({
      ...response.data,
      data: response.data.data.map(mapFinancialEntry),
    });
  },
  async getById(id: string) {
    const response = await http.get<FinancialEntryApiResponse>(`/financial/${id}`);
    return mapFinancialEntry(response.data);
  },
  async getSummary() {
    const response = await http.get<{ receivablesValue: number | string; stockOutValue: number | string }>('/financial/summary');

    return {
      receivablesValue: toNumber(response.data.receivablesValue),
      stockOutValue: toNumber(response.data.stockOutValue),
    };
  },
  async create(payload: {
    type: FinancialType;
    description: string;
    category: string;
    amount: number;
    dueDate: string;
    paymentMethod?: PaymentMethod;
    status?: FinancialStatus;
    clientId?: string;
    serviceOrderId?: string;
    notes?: string;
  }) {
    const response = await http.post<FinancialEntryApiResponse>('/financial', payload);
    return mapFinancialEntry(response.data);
  },
  async update(
    id: string,
    payload: Partial<{
      type: FinancialType;
      description: string;
      category: string;
      amount: number;
      dueDate: string;
      paymentMethod?: PaymentMethod;
      status?: FinancialStatus;
      clientId?: string;
      serviceOrderId?: string;
      notes?: string;
    }>,
  ) {
    const response = await http.patch<FinancialEntryApiResponse>(`/financial/${id}`, payload);
    return mapFinancialEntry(response.data);
  },
  async markAsPaid(id: string, payload: { paymentMethod: PaymentMethod; paidAt: string }) {
    const response = await http.patch<FinancialEntryApiResponse>(`/financial/${id}/pay`, payload);
    return mapFinancialEntry(response.data);
  },
};
