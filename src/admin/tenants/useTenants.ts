import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin-api';

export type TenantPlan =
  | 'ESSENTIAL'
  | 'PROFESSIONAL'
  | 'PERFORMANCE'
  | 'TRIALING'
  | 'PILOT'
  | 'LEGACY_FREE'
  | 'UNASSIGNED';
export type TenantStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'SUSPENDED'
  | 'CANCELED'
  | 'EXPIRED'
  | 'PILOT'
  | 'LEGACY_FREE'
  | 'INACTIVE'
  | 'UNASSIGNED';
export type TenantType = 'MECANICA' | 'FUNILARIA' | 'AMBOS';

export interface Tenant {
  id: string;
  name: string;
  tradeName: string;
  ownerName?: string | null;
  email?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  state?: string | null;
  plan: TenantPlan;
  planName?: string | null;
  planAmount?: number | null;
  status: TenantStatus;
  type?: TenantType | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  lastActivityAt?: string | null;
  usersCount: number;
  authenticatedUsersCount?: number;
  employeesCount?: number;
  serviceOrdersCount: number;
}

export interface TenantPayload {
  name: string;
  ownerName: string;
  email: string;
  phone?: string;
  cnpj?: string;
  state?: string;
  plan: TenantPlan;
  type: TenantType;
  notes?: string;
}

interface TenantFilters {
  search?: string;
  status?: string;
  plan?: string;
  page?: number;
}

interface TenantListResponse {
  data: Tenant[];
  meta: { total: number; page: number; limit: number; pages: number };
}

function tenantParams(filters: TenantFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.plan) params.set('plan', filters.plan);
  if (filters.page) params.set('page', String(filters.page));
  return params;
}

export function useTenants(filters: TenantFilters) {
  return useQuery({
    queryKey: ['admin', 'tenants', filters],
    queryFn: () =>
      adminApi.get<TenantListResponse>(`/tenants?${tenantParams(filters)}`).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TenantPayload) => adminApi.post<Tenant>('/tenants', data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] }),
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TenantPayload> }) =>
      adminApi.patch<Tenant>(`/tenants/${id}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] }),
  });
}

export function useInactivateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.patch<Tenant>(`/tenants/${id}/inactivate`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] }),
  });
}

export function useReactivateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.patch<Tenant>(`/tenants/${id}/reactivate`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] }),
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.delete<Tenant>(`/tenants/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] }),
  });
}

export function useSetPilotWorkshop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi
        .post<{ status: 'PILOT' }>(`/billing/workshops/${id}/pilot`, { reason })
        .then((response) => response.data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
      ]);
    },
  });
}
