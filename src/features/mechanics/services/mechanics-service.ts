import { http } from '@/services/api/http';
import { buildQueryParams, mapPaginatedResponse } from '@/services/api/query-string';
import type { ApiPaginatedResponse, QueryParams } from '@/types/common';
import type { Mechanic } from '@/features/mechanics/types';

interface MechanicPayload {
  name: string;
  isActive?: boolean | undefined;
}

function mapMechanic(mechanic: Mechanic): Mechanic {
  return mechanic;
}

export const mechanicsService = {
  async list(params: QueryParams & { active?: boolean | undefined }) {
    const response = await http.get<ApiPaginatedResponse<Mechanic>>('/mechanics', {
      params: {
        ...buildQueryParams(params),
      },
    });

    return mapPaginatedResponse({
      ...response.data,
      data: response.data.data.map(mapMechanic),
    });
  },
  async getById(id: string) {
    const response = await http.get<Mechanic>(`/mechanics/${id}`);
    return mapMechanic(response.data);
  },
  async create(payload: MechanicPayload) {
    const response = await http.post<Mechanic>('/mechanics', payload);
    return mapMechanic(response.data);
  },
  async update(id: string, payload: Partial<MechanicPayload>) {
    const response = await http.patch<Mechanic>(`/mechanics/${id}`, payload);
    return mapMechanic(response.data);
  },
};
