import { http } from '@/services/api/http';
import {
  buildQueryParams,
  mapPaginatedResponse,
} from '@/services/api/query-string';
import type { ApiPaginatedResponse, QueryParams } from '@/types/common';
import type {
  AccessUser,
  CreateAccessUserPayload,
} from '@/features/users/types';
import type { Role } from '@/types/auth';

export const usersService = {
  async list(
    params: QueryParams & {
      active?: boolean | undefined;
      role?: Role | undefined;
      eligibleForEmployee?: boolean | undefined;
    },
  ) {
    const response = await http.get<ApiPaginatedResponse<AccessUser>>(
      '/users',
      {
        params: {
          ...buildQueryParams(params),
          ...(params.role ? { role: params.role } : {}),
          ...(params.eligibleForEmployee !== undefined
            ? { eligibleForEmployee: String(params.eligibleForEmployee) }
            : {}),
        },
      },
    );
    return mapPaginatedResponse(response.data);
  },

  async create(payload: CreateAccessUserPayload) {
    const response = await http.post<AccessUser>('/users', payload);
    return response.data;
  },
};
