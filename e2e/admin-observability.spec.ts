import { expect, test } from '@playwright/test';

const adminMasterResponse = {
  accessToken: 'synthetic-admin-master-token',
  user: {
    id: 'admin-master',
    name: 'Admin Master',
    email: 'admin@example.test',
    role: 'ADMIN',
    adminRole: 'SUPER_ADMIN',
  },
};

const supportAdminResponse = {
  accessToken: 'synthetic-support-admin-token',
  user: {
    id: 'support-admin',
    name: 'Support Admin',
    email: 'support@example.test',
    role: 'ADMIN',
    adminRole: 'SUPPORT',
  },
};

const observabilitySnapshot = {
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
    byStatusFamily: [{ name: '2xx', count: 3 }],
    byRoute: [
      {
        routeTemplate: '/api/v1/health/ready',
        method: 'GET',
        statusCodeFamily: '2xx',
        errorCategory: 'none',
        count: 2,
      },
    ],
  },
  latency: {
    routes: [
      {
        routeTemplate: '/api/v1/health/ready',
        method: 'GET',
        count: 2,
        p50Ms: 8,
        p95Ms: 12,
        p99Ms: 12,
      },
    ],
  },
  errors: { byCategory: [{ name: 'INTERNAL', count: 1 }], byRoute: [] },
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
        count: 1,
      },
    ],
  },
  aggregation: {
    current: { counterKeys: 5, latencyKeys: 1, recentEventBufferSize: 4 },
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

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/admin/support/summary', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ active: 0 }),
    }),
  );
  await page.route('**/api/v1/admin/logs/summary', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ critical: 0 }),
    }),
  );
});

test('Admin Master acessa painel de observabilidade sanitizado', async ({
  page,
}) => {
  await page.route('**/api/v1/admin/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(adminMasterResponse),
    }),
  );
  await page.route('**/api/v1/admin/observability', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(observabilitySnapshot),
    }),
  );

  await page.goto('/admin/login');
  await page.getByLabel('E-mail').fill('admin@example.test');
  await page.getByLabel('Senha').fill('senha-sintetica');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByTestId('admin-observability-nav').click();

  await expect(page.getByTestId('admin-observability-page')).toBeVisible();
  await expect(page.getByTestId('observability-scope-note')).toContainText(
    'Dados do processo atual, sem retenção persistente',
  );
  await expect(page.getByText('/api/v1/health/ready')).toHaveCount(2);
  await expect(
    page.getByText('financial_overdue_promotion_failed'),
  ).toBeVisible();
  await expect(page.getByText('auth_login_failed')).toBeVisible();
  await expect(
    page.getByText(
      /person@example.test|secret-token|tenant-1|stack trace|DATABASE_URL/i,
    ),
  ).toHaveCount(0);
});

test('admin sem papel Admin Master nao acessa rota nem navegacao', async ({
  page,
}) => {
  await page.route('**/api/v1/admin/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(supportAdminResponse),
    }),
  );

  await page.goto('/admin/login');
  await page.getByLabel('E-mail').fill('support@example.test');
  await page.getByLabel('Senha').fill('senha-sintetica');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByTestId('admin-observability-nav')).toHaveCount(0);
  await page.goto('/admin/observability');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByTestId('admin-observability-page')).toHaveCount(0);
});
