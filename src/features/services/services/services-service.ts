import { http } from '@/services/api/http';
import { buildQueryParams, mapPaginatedResponse } from '@/services/api/query-string';
import type { ApiPaginatedResponse, QueryParams } from '@/types/common';
import type { ServiceBillingType, ServiceCatalogItem, ServiceMaterialSource } from '@/features/services/types';
import { toNumber } from '@/lib/utils';

interface ServiceCatalogItemApiResponse extends Omit<ServiceCatalogItem, 'laborPrice' | 'productPrice' | 'suggestedTotalPrice'> {
  laborPrice: number | string;
  productPrice: number | string;
  suggestedTotalPrice: number | string;
}

interface ServiceCatalogPayload {
  code?: string;
  name?: string;
  category?: string;
  description?: string | null;
  internalNotes?: string | null;
  laborPrice?: number;
  productPrice?: number;
  billingType?: ServiceBillingType;
  materialSource?: ServiceMaterialSource;
  warrantyDays?: number | null;
}

function mapServiceCatalogItem(item: ServiceCatalogItemApiResponse): ServiceCatalogItem {
  return {
    ...item,
    laborPrice: toNumber(item.laborPrice),
    productPrice: toNumber(item.productPrice),
    suggestedTotalPrice: toNumber(item.suggestedTotalPrice),
  };
}

export const servicesService = {
  async list(params: QueryParams & { category?: string; active?: boolean }) {
    const response = await http.get<ApiPaginatedResponse<ServiceCatalogItemApiResponse>>('/services', {
      params: buildQueryParams(params),
    });

    return mapPaginatedResponse({
      ...response.data,
      data: response.data.data.map(mapServiceCatalogItem),
    });
  },
  async getById(id: string) {
    const response = await http.get<ServiceCatalogItemApiResponse>(`/services/${id}`);
    return mapServiceCatalogItem(response.data);
  },
  async create(payload: ServiceCatalogPayload) {
    const response = await http.post<ServiceCatalogItemApiResponse>('/services', payload);
    return mapServiceCatalogItem(response.data);
  },
  async update(id: string, payload: ServiceCatalogPayload) {
    const response = await http.patch<ServiceCatalogItemApiResponse>(`/services/${id}`, payload);
    return mapServiceCatalogItem(response.data);
  },
  async activate(id: string) {
    const response = await http.patch<ServiceCatalogItemApiResponse>(`/services/${id}/activate`);
    return mapServiceCatalogItem(response.data);
  },
  async deactivate(id: string) {
    const response = await http.patch<ServiceCatalogItemApiResponse>(`/services/${id}/deactivate`);
    return mapServiceCatalogItem(response.data);
  },
};
