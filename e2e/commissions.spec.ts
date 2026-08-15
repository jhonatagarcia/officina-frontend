import { expect, test } from '@playwright/test';
import {
  interceptApi,
  interceptApiMethod,
  paginated,
  syntheticSession,
} from './fixtures/api';

const employee = {
  id: 'employee-e2e-1',
  name: 'Funcionario Sintetico',
  function: 'MECHANIC',
  isActive: true,
  hasAccess: true,
  user: null,
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
};

const ledger = {
  data: [
    {
      id: 'commission-e2e-1',
      employeeId: employee.id,
      serviceOrderId: 'os-e2e-1',
      financialEntryId: 'financial-e2e-1',
      entryType: 'COMMISSION_EARNED',
      laborBaseAmount: 200,
      commissionRateBps: 1250,
      amount: 25,
      currency: 'BRL',
      reason: null,
      occurredAt: '2026-01-01T12:00:00.000Z',
      createdAt: '2026-01-01T12:00:00.000Z',
    },
  ],
  meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
  balance: 25,
};

async function authenticated(
  page: import('@playwright/test').Page,
  role: Parameters<typeof syntheticSession>[0],
) {
  await page.route('**/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(syntheticSession(role)),
    }),
  );
}

test('admin configura politica versionada e consulta extrato do funcionario', async ({
  page,
}) => {
  await authenticated(page, 'ADMIN');
  await interceptApi(page, '/mechanics', paginated([employee]));
  await interceptApi(page, `/commissions/employees/${employee.id}`, ledger);
  await interceptApi(page, `/commissions/employees/${employee.id}/policy`, {
    id: 'policy-e2e-1',
    employeeId: employee.id,
    rateBps: 1250,
    effectiveFrom: '2026-01-01T12:00:00.000Z',
    effectiveTo: null,
    reason: null,
  });
  await interceptApiMethod(
    page,
    `/commissions/employees/${employee.id}/policy`,
    'PUT',
    {
      id: 'policy-e2e-2',
      employeeId: employee.id,
      rateBps: 1500,
      effectiveFrom: '2026-01-02T12:00:00.000Z',
      effectiveTo: null,
      reason: null,
    },
  );

  await page.goto('/inicio/comissoes');

  await expect(page.getByText('Funcionario Sintetico')).toBeVisible();
  await expect(page.getByText('Comissao elegivel')).toBeVisible();
  await expect(page.getByText('R$ 25,00').first()).toBeVisible();
  await expect(page.getByLabel('Percentual')).toHaveValue('12.5');

  await page.getByLabel('Percentual').fill('15');
  const requestPromise = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request
        .url()
        .includes(`/api/v1/commissions/employees/${employee.id}/policy`),
  );
  await page.getByRole('button', { name: 'Salvar politica' }).click();
  const request = await requestPromise;
  expect(request.postDataJSON()).toEqual({ ratePercent: 15 });
  await expect(page.getByText('Política de comissão salva.')).toBeVisible();
});

test('mecanico consulta somente o proprio extrato', async ({ page }) => {
  await authenticated(page, 'MECANICO');
  await interceptApi(page, '/commissions/me', ledger);

  await page.goto('/inicio/comissoes');

  await expect(
    page.getByText('Seu extrato de comissao sobre mao de obra paga.'),
  ).toBeVisible();
  await expect(page.getByText('Comissao elegivel')).toBeVisible();
  await expect(page.getByText('Politica do funcionario')).toHaveCount(0);
});

test('financeiro nao acessa extratos de comissao', async ({ page }) => {
  await authenticated(page, 'FINANCEIRO');

  await page.goto('/inicio/comissoes');

  await expect(
    page.getByRole('heading', { name: 'Acesso não autorizado' }),
  ).toBeVisible();
});
