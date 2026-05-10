import { http } from '@/services/api/http';
import { buildQueryParams, mapPaginatedResponse } from '@/services/api/query-string';
import type { ApiPaginatedResponse, QueryParams } from '@/types/common';
import type { Client, ClientVehicleSummary } from '@/features/clients/types';

interface ClientApiResponse {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClientDetailApiResponse extends ClientApiResponse {
  vehicles: ClientVehicleSummary[];
}

function mapClient(client: ClientApiResponse): Client {
  return client;
}

function mapClientDetail(client: ClientDetailApiResponse): Client {
  return {
    ...client,
    vehicles: client.vehicles,
  };
}

export const clientsService = {
  async list(params: QueryParams) {
    const response = await http.get<ApiPaginatedResponse<ClientApiResponse>>('/clients', {
      params: buildQueryParams(params),
    });

    return mapPaginatedResponse({
      ...response.data,
      data: response.data.data.map(mapClient),
    });
  },
  async getById(id: string) {
    const response = await http.get<ClientDetailApiResponse>(`/clients/${id}`);
    return mapClientDetail(response.data);
  },
  async create(payload: Pick<Client, 'name' | 'document' | 'phone' | 'email' | 'notes'>) {
    const response = await http.post<ClientApiResponse>('/clients', payload);
    return mapClient(response.data);
  },
  async update(
    id: string,
    payload: Partial<Pick<Client, 'name' | 'document' | 'phone' | 'email' | 'notes'>>,
  ) {
    const response = await http.patch<ClientApiResponse>(`/clients/${id}`, payload);
    return mapClient(response.data);
  },
};
