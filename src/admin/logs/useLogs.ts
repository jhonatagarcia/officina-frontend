import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin-api';

export interface AdminLog {
  level: 'ERROR' | 'WARN' | 'INFO';
  category: 'ADMIN' | 'AUTH' | 'HTTP' | 'SECURITY' | 'QUEUE' | 'WAHA' | 'REDIS';
  source?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  adminEmail?: string | null;
  ipAddress?: string | null;
  path?: string | null;
  method?: string | null;
  statusCode?: number | null;
  message: string;
  createdAt: string;
}

export interface AdminLogSummary {
  recent: number;
  errors: number;
  warnings: number;
  security: number;
  waha: number;
  redis: number;
  queue: number;
  critical: number;
  latest?: Pick<AdminLog, 'createdAt' | 'level' | 'category' | 'message'> | null;
}

export function useAdminLogs(level?: string, category?: string) {
  return useQuery({
    queryKey: ['admin', 'logs', level, category],
    queryFn: () =>
      adminApi
        .get<AdminLog[]>('/logs', {
          params: {
            ...(level ? { level } : {}),
            ...(category ? { category } : {}),
          },
        })
        .then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useAdminLogSummary() {
  return useQuery({
    queryKey: ['admin', 'logs', 'summary'],
    queryFn: () => adminApi.get<AdminLogSummary>('/logs/summary').then((r) => r.data),
    staleTime: 30_000,
  });
}
