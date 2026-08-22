import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminApp from '@/admin/AdminApp';
import { adminApi } from '@/admin/api/admin-api';
import { Sidebar } from '@/admin/components/Sidebar';
import ObservabilityPage from '@/admin/observability/ObservabilityPage';
import type { ObservabilitySnapshot } from '@/admin/observability/useObservability';
import { useAdminAuth } from '@/admin/auth/useAdminAuth';

const adminMaster = {
  id: 'admin-master',
  name: 'Admin Master',
  email: 'admin@example.test',
  role: 'ADMIN' as const,
  adminRole: 'SUPER_ADMIN' as const,
};

const supportAdmin = {
  ...adminMaster,
  id: 'support-admin',
  adminRole: 'SUPPORT' as const,
};

const snapshot: ObservabilitySnapshot = {
  generatedAt: '2026-08-06T12:00:00.000Z',
  source: {
    available: true,
    scope: 'current_process',
    persistence: 'none',
    inMemoryOnly: true,
    retentionNote:
      'Retencoes dependem de Railway e/ou persistencia futura aprovada.',
  },
  health: {
    liveness: {
      status: 'ok',
      checks: 1,
      lastCheckedAt: '2026-08-06T12:00:00.000Z',
    },
    readiness: {
      status: 'ready',
      checks: 1,
      lastCheckedAt: '2026-08-06T12:00:00.000Z',
      dependencies: [{ dependency: 'database', status: 'ok' }],
    },
  },
  http: {
    byStatusFamily: [{ name: '2xx', count: 4 }],
    byRoute: [
      {
        routeTemplate: '/api/v1/clients/:id',
        method: 'GET',
        statusCodeFamily: '5xx',
        errorCategory: 'INTERNAL',
        count: 1,
      },
    ],
  },
  latency: {
    routes: [
      {
        routeTemplate: '/api/v1/clients/:id',
        method: 'GET',
        count: 4,
        p50Ms: 10,
        p95Ms: 25,
        p99Ms: 30,
      },
    ],
  },
  errors: {
    byCategory: [{ name: 'INTERNAL', count: 1 }],
    byRoute: [],
  },
  financial: {
    events: [
      {
        eventName: 'financial_overdue_promotion_failed',
        outcome: 'failure',
        errorCategory: 'INTERNAL',
        count: 1,
      },
    ],
  },
  authSecurity: {
    events: [
      {
        eventName: 'auth_login_failed',
        outcome: 'failure',
        errorCategory: 'AUTHENTICATION',
        count: 2,
      },
    ],
  },
  aggregation: {
    current: { counterKeys: 6, latencyKeys: 1, recentEventBufferSize: 5 },
    limits: {
      maxCounterKeys: 200,
      maxLatencyKeys: 120,
      maxLatencySamplesPerKey: 120,
      maxRecentEvents: 100,
    },
  },
  queueFuture: {
    status: 'inactive',
    metrics: {
      waitingJobs: 0,
      activeJobs: 0,
      failedJobs: 0,
      delayedJobs: 0,
      oldestJobAgeSeconds: 0,
    },
    note: 'Contrato futuro inativo.',
  },
};

function renderWithProviders(
  ui: React.ReactElement,
  initialEntries = ['/admin/observability'],
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ObservabilityPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza snapshot sanitizado sem PII ou detalhes internos', async () => {
    vi.spyOn(adminApi, 'get').mockResolvedValue({ data: snapshot });

    renderWithProviders(<ObservabilityPage />);

    expect(
      await screen.findByTestId('admin-observability-page'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('observability-scope-note')).toHaveTextContent(
      'Dados do processo atual, sem retenção persistente',
    );
    expect(await screen.findAllByText('/api/v1/clients/:id')).toHaveLength(2);
    expect(
      screen.getByText('financial_overdue_promotion_failed'),
    ).toBeInTheDocument();
    expect(screen.getByText('auth_login_failed')).toBeInTheDocument();
    expect(screen.queryByText(/person@example.test/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/secret-token/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tenant-1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/stack/i)).not.toBeInTheDocument();
  });

  it('mostra estado vazio seguro', async () => {
    vi.spyOn(adminApi, 'get').mockResolvedValue({
      data: {
        ...snapshot,
        http: { byStatusFamily: [], byRoute: [] },
        latency: { routes: [] },
        errors: { byCategory: [], byRoute: [] },
        financial: { events: [] },
        authSecurity: { events: [] },
      },
    });

    renderWithProviders(<ObservabilityPage />);

    expect(await screen.findByTestId('observability-empty')).toHaveTextContent(
      'Nenhum agregado operacional disponível neste processo.',
    );
  });

  it('mostra erro seguro sem detalhe interno', async () => {
    vi.spyOn(adminApi, 'get').mockRejectedValue(
      new Error('DATABASE_URL=secret stack trace'),
    );

    renderWithProviders(<ObservabilityPage />);

    expect(await screen.findByTestId('observability-error')).toHaveTextContent(
      'Não foi possível carregar o snapshot sanitizado.',
    );
    expect(screen.queryByText(/DATABASE_URL/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument();
  });
});

describe('Admin Master observability route and navigation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('bloqueia rota de observabilidade para admin sem papel Admin Master', async () => {
    useAdminAuth.setState({ token: 'support-token', user: supportAdmin });

    renderWithProviders(
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>,
      ['/admin/observability'],
    );

    await waitFor(() =>
      expect(
        screen.getByText('Acesso Administrador Master'),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByTestId('admin-observability-page'),
    ).not.toBeInTheDocument();
  });

  it('mostra navegação somente para Admin Master', () => {
    vi.spyOn(adminApi, 'get').mockResolvedValue({
      data: { active: 0, critical: 0 },
    });
    useAdminAuth.setState({ token: 'support-token', user: supportAdmin });

    const { rerender } = renderWithProviders(<Sidebar />);

    expect(
      screen.queryByTestId('admin-observability-nav'),
    ).not.toBeInTheDocument();

    useAdminAuth.setState({ token: 'master-token', user: adminMaster });
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('admin-observability-nav')).toBeInTheDocument();
  });
});
