import { expect, test } from '@playwright/test';
import {
  fixtures,
  futureFlowFixtures,
  interceptApi,
  interceptApiMethod,
  paginated,
  syntheticSession,
} from './fixtures/api';

async function authenticated(page: import('@playwright/test').Page, role: Parameters<typeof syntheticSession>[0] = 'ADMIN') {
  await page.route('**/auth/refresh', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(syntheticSession(role)) }),
  );
}

async function interceptFinancialPage(page: import('@playwright/test').Page, entries: () => unknown) {
  await interceptApi(page, '/financial', entries);
  await interceptApi(page, '/financial/summary', { receivablesValue: 300, stockOutValue: 0 });
}

test('lista estados financeiros e aplica filtros visíveis', async ({ page }) => {
  await authenticated(page);
  await interceptFinancialPage(page, futureFlowFixtures.financial);

  await page.goto('/inicio/financeiro');

  await expect(page.getByText('Em aberto', { exact: true })).toBeVisible();
  await expect(page.getByText('Pago', { exact: true })).toBeVisible();
  await expect(page.getByText('Vencido', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: /em aberto/i }).click();
  await expect(page.getByText('Lançamento em aberto sintético')).toBeVisible();
  await expect(page.getByText('Lançamento pago sintético')).toHaveCount(0);
  await expect(page.getByText('Lançamento vencido sintético')).toHaveCount(0);
});

test('mostra estado vazio ao filtrar sem lançamentos correspondentes', async ({ page }) => {
  await authenticated(page);
  await interceptFinancialPage(page, () => paginated([fixtures.financialOpen]));

  await page.goto('/inicio/financeiro');
  await page.getByRole('button', { name: /pago/i }).click();

  await expect(page.getByText('Nenhum registro encontrado').first()).toBeVisible();
});

test('cria lançamento financeiro em aberto com contrato HTTP esperado', async ({ page }) => {
  await authenticated(page);
  let entries = [...futureFlowFixtures.financial().data];
  await interceptFinancialPage(page, () => paginated(entries));
  await interceptApiMethod(page, '/financial', 'POST', (route) => {
    const payload = route.request().postDataJSON() as {
      type: 'RECEIVABLE'; description: string; category: string; amount: number; dueDate: string; status: 'EM_ABERTO';
    };
    const created = {
      ...fixtures.financialOpen,
      id: 'financial-e2e-created',
      type: payload.type,
      description: payload.description,
      category: payload.category,
      amount: payload.amount,
      dueDate: payload.dueDate,
      status: payload.status,
    };
    entries = [...entries, created];
    return created;
  });

  await page.goto('/inicio/financeiro');
  await page.getByRole('button', { name: 'Novo lançamento', exact: true }).click();
  await page.getByLabel('Descrição').fill('Recebível E2E');
  await page.getByLabel('Categoria').fill('Serviço sintético');
  await page.getByLabel('Valor').fill('125.5');
  await page.getByLabel('Vencimento').fill('2026-02-15');

  const requestPromise = page.waitForRequest((request) => request.method() === 'POST' && request.url().endsWith('/api/v1/financial'));
  await page.getByRole('button', { name: 'Criar lançamento', exact: true }).click();
  const request = await requestPromise;

  expect(request.postDataJSON()).toEqual({
    type: 'RECEIVABLE',
    description: 'Recebível E2E',
    category: 'Serviço sintético',
    amount: 125.5,
    dueDate: new Date('2026-02-15T12:00:00').toISOString(),
    status: 'EM_ABERTO',
  });
  await expect(page.getByText('Lançamento financeiro criado.')).toBeVisible();
  await expect(page.getByText('Recebível E2E')).toBeVisible();
});

test('registra pagamento permitido de lançamento em aberto', async ({ page }) => {
  await authenticated(page);
  let entries = [fixtures.financialOpen];
  await interceptFinancialPage(page, () => paginated(entries));
  await interceptApiMethod(page, `/financial/${fixtures.financialOpen.id}/pay`, 'PATCH', () => {
    const paid = { ...fixtures.financialOpen, status: 'PAGO', paidAt: '2026-02-15T12:00:00.000Z', paymentMethod: 'PIX' };
    entries = [paid];
    return paid;
  });

  await page.goto('/inicio/financeiro');
  const requestPromise = page.waitForRequest((request) => request.method() === 'PATCH' && request.url().endsWith(`/api/v1/financial/${fixtures.financialOpen.id}/pay`));
  await page.getByRole('button', { name: 'Registrar pagamento', exact: true }).click();
  const request = await requestPromise;

  expect(request.postDataJSON()).toEqual(expect.objectContaining({ paymentMethod: 'PIX' }));
  await expect(page.getByText('Pago', { exact: true })).toBeVisible();
});

test('não expõe baixa financeira a perfil sem permissão', async ({ page }) => {
  await authenticated(page, 'ATENDENTE');

  await page.goto('/inicio/financeiro');

  await expect(page.getByRole('heading', { name: 'Acesso não autorizado' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Registrar pagamento', exact: true })).toHaveCount(0);
});

test('mostra erro seguro ao falhar a baixa financeira', async ({ page }) => {
  await authenticated(page);
  await interceptFinancialPage(page, () => paginated([fixtures.financialOpen]));
  await interceptApiMethod(
    page,
    `/financial/${fixtures.financialOpen.id}/pay`,
    'PATCH',
    { statusCode: 500, message: 'DATABASE_URL-secret' },
    500,
  );

  await page.goto('/inicio/financeiro');
  await page.getByRole('button', { name: 'Registrar pagamento', exact: true }).click();

  await expect(page.getByText('Não foi possível processar a solicitação.')).toBeVisible();
  await expect(page.getByText('DATABASE_URL-secret')).toHaveCount(0);
});
