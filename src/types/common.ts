export interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  details?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiPaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  type?: string;
  category?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Option {
  label: string;
  value: string;
}
