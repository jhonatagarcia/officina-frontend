import type { QueryParams } from '@/types/common';

export function buildQueryParams(params: QueryParams) {
  const mapped = {
    page: params.page,
    limit: params.pageSize,
    search: params.search,
    category: params.category,
    active: params.active === undefined ? undefined : String(params.active),
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  };

  return Object.fromEntries(Object.entries(mapped).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

export function mapPaginatedResponse<T>(response: { data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } }) {
  return {
    data: response.data,
    page: response.meta.page,
    pageSize: response.meta.limit,
    total: response.meta.total,
    totalPages: response.meta.totalPages,
  };
}
