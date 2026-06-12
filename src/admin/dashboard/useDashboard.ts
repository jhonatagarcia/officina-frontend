import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin-api';

export type Period = 'weekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'annual';

export interface DashboardKpis {
  mrr: number;
  arr: number;
  totalWorkshops: number;
  active: number;
  paying: number;
  inactive: number;
  atRisk: number;
  churnRate: number;
  newInPeriod: number;
  planDistribution: Record<string, number>;
}

export interface RevenuePoint {
  label: string;
  mrr: number;
}

export interface FunnelData {
  registered: number;
  trialActive: number;
  firstServiceOrder: number;
  paying: number;
  active60d: number;
}

export function useDashboardKpis(period: Period) {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'kpis', period],
    queryFn: () =>
      adminApi.get<DashboardKpis>('/dashboard/kpis', { params: { period } }).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useRevenueSeries(period: Period) {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'revenue', period],
    queryFn: () =>
      adminApi
        .get<RevenuePoint[]>('/dashboard/revenue', { params: { period } })
        .then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useOnboardingFunnel() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'funnel'],
    queryFn: () => adminApi.get<FunnelData>('/dashboard/funnel').then((r) => r.data),
    staleTime: 300_000,
  });
}
