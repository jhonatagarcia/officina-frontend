import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin-api';

export interface ObservabilityCounter {
  name: string;
  count: number;
}

export interface ObservabilityHttpCounter {
  routeTemplate: string;
  method: string;
  statusCodeFamily: string;
  errorCategory: string;
  count: number;
}

export interface ObservabilityLatency {
  routeTemplate: string;
  method: string;
  count: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

export interface ObservabilityDomainEvent {
  eventName: string;
  outcome: string;
  errorCategory: string;
  count: number;
}

export interface ObservabilitySnapshot {
  generatedAt: string;
  source: {
    available: boolean;
    scope: 'current_process';
    persistence: 'none';
    inMemoryOnly: true;
    retentionNote: string;
  };
  health: {
    liveness: {
      status: 'ok' | 'unknown';
      checks: number;
      lastCheckedAt: string | null;
    };
    readiness: {
      status: 'ready' | 'not_ready' | 'unknown';
      checks: number;
      lastCheckedAt: string | null;
      dependencies: Array<{
        dependency: string;
        status: 'ok' | 'error' | 'unknown';
      }>;
    };
  };
  http: {
    byStatusFamily: ObservabilityCounter[];
    byRoute: ObservabilityHttpCounter[];
  };
  latency: {
    routes: ObservabilityLatency[];
  };
  errors: {
    byCategory: ObservabilityCounter[];
    byRoute: ObservabilityHttpCounter[];
  };
  financial: {
    events: ObservabilityDomainEvent[];
  };
  authSecurity: {
    events: ObservabilityDomainEvent[];
  };
  aggregation: {
    current: {
      counterKeys: number;
      latencyKeys: number;
      recentEventBufferSize: number;
    };
    limits: {
      maxCounterKeys: number;
      maxLatencyKeys: number;
      maxLatencySamplesPerKey: number;
      maxRecentEvents: number;
    };
  };
  queueFuture: {
    status: 'inactive';
    metrics: {
      waitingJobs: 0;
      activeJobs: 0;
      failedJobs: 0;
      delayedJobs: 0;
      oldestJobAgeSeconds: 0;
    };
    note: string;
  };
}

export function useObservabilitySnapshot() {
  return useQuery({
    queryKey: ['admin', 'observability'],
    queryFn: () =>
      adminApi
        .get<ObservabilitySnapshot>('/observability')
        .then((response) => response.data),
  });
}
