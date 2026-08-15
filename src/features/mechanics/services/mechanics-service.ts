import { http } from '@/services/api/http';
import {
  buildQueryParams,
  mapPaginatedResponse,
} from '@/services/api/query-string';
import type { ApiPaginatedResponse, QueryParams } from '@/types/common';
import type { Mechanic } from '@/features/mechanics/types';

export interface MechanicPayload {
  name: string;
  function: 'MECHANIC';
  isActive?: boolean | undefined;
  userId?: string | null | undefined;
}

function mapMechanic(mechanic: Mechanic): Mechanic {
  return mechanic;
}

export const mechanicsService = {
  /** Compatibilidade operacional: lista somente funcionarios elegiveis para atribuicao em OS. */
  async list(params: QueryParams & { active?: boolean | undefined }) {
    const response = await http.get<ApiPaginatedResponse<Mechanic>>(
      '/mechanics',
      {
        params: {
          ...buildQueryParams(params),
        },
      },
    );

    return mapPaginatedResponse({
      ...response.data,
      data: response.data.data.map(mapMechanic),
    });
  },
  async listEmployees(params: QueryParams & { active?: boolean | undefined }) {
    const response = await http.get<ApiPaginatedResponse<Mechanic>>(
      '/employees',
      {
        params: {
          ...buildQueryParams(params),
          function: 'MECHANIC',
        },
      },
    );

    return mapPaginatedResponse({
      ...response.data,
      data: response.data.data.map(mapMechanic),
    });
  },
  async getById(id: string) {
    const response = await http.get<Mechanic>(`/employees/${id}`);
    return mapMechanic(response.data);
  },
  async create(payload: MechanicPayload) {
    const response = await http.post<Mechanic>('/employees', payload);
    return mapMechanic(response.data);
  },
  async update(id: string, payload: Partial<MechanicPayload>) {
    const response = await http.patch<Mechanic>(`/employees/${id}`, payload);
    return mapMechanic(response.data);
  },
};
