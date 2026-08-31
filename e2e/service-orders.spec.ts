import { expect, test } from '@playwright/test';
import {
  fixtures,
  futureFlowFixtures,
  interceptApi,
  interceptApiMethod,
  syntheticSession,
} from './fixtures/api';

async function authenticated(page: import('@playwright/test').Page, role: Parameters<typeof syntheticSession>[0] = 'ADMIN') {
  await page.route('**/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(syntheticSession(role)),
    }),
  );
}

async function interceptServiceOrderDetail(page: import('@playwright/test').Page, getOrder: () => unknown) {
  await interceptApi(page, `/service-orders/${fixtures.serviceOrder.id}`, getOrder);
  await interceptApi(page, '/mechanics', { data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } });
}

test('lista a OS sintética do cliente e veículo associados', async ({ page }) => {
  await authenticated(page);
  await interceptApi(page, '/service-orders', futureFlowFixtures.serviceOrders());

  await page.goto('/inicio/ordens-servico');

  await expect(page.getByText('OS-E2E-001')).toBeVisible();
  await expect(page.getByText('Cliente Sintético').first()).toBeVisible();
  await expect(page.getByText('SYN-0E00')).toBeVisible();
});

test('mostra estado vazio de ordens de serviço', async ({ page }) => {
  await authenticated(page);
  await interceptApi(page, '/service-orders', { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });

  await page.goto('/inicio/ordens-servico');

  await expect(page.getByText('Nenhum registro encontrado').first()).toBeVisible();
});

test('abre OS ao converter orçamento aprovado do cliente e veículo sintéticos', async ({ page }) => {
  await authenticated(page);
  await interceptApi(page, '/budgets', futureFlowFixtures.budgets());
  await interceptServiceOrderDetail(page, () => fixtures.serviceOrder);
  await interceptApiMethod(
    page,
    `/budgets/${fixtures.budget.id}/convert-to-service-order`,
    'POST',
    { serviceOrder: { id: fixtures.serviceOrder.id } },
  );

  await page.goto('/inicio/orcamentos');
  await page.getByRole('button', { name: 'Converter em OS', exact: true }).click();

  await expect(page).toHaveURL(new RegExp(`/inicio/ordens-servico/${fixtures.serviceOrder.id}$`));
  await expect(page.getByText('OS-E2E-001')).toBeVisible();
  await expect(page.getByText('Cliente Sintético').first()).toBeVisible();
  await expect(page.getByText('SYN-0E00')).toBeVisible();
});

test('atualiza status permitido com o contrato HTTP esperado', async ({ page }) => {
  await authenticated(page);
  let currentOrder = fixtures.serviceOrder;
  await interceptServiceOrderDetail(page, () => currentOrder);
  await interceptApiMethod(page, `/service-orders/${fixtures.serviceOrder.id}/status`, 'PATCH', () => {
    currentOrder = { ...fixtures.serviceOrder, status: 'EM_ANDAMENTO' };
    return currentOrder;
  });

  await page.goto(`/inicio/ordens-servico/${fixtures.serviceOrder.id}?mode=operate`);
  await page.getByRole('combobox', { name: 'Novo status da OS' }).click();
  await page.getByRole('option', { name: 'Em andamento', exact: true }).click();

  const requestPromise = page.waitForRequest((request) =>
    request.method() === 'PATCH' && request.url().includes(`/api/v1/service-orders/${fixtures.serviceOrder.id}/status`),
  );
  await page.getByRole('button', { name: 'Atualizar status', exact: true }).click();
  const request = await requestPromise;

  expect(request.postDataJSON()).toEqual({ status: 'EM_ANDAMENTO' });
  await expect(page.getByText('Status atualizado com sucesso.')).toBeVisible();
  await expect(page.getByText('Em andamento', { exact: true }).first()).toBeVisible();
});

test('mostra erro seguro quando a atualização de status falha', async ({ page }) => {
  await authenticated(page);
  await interceptServiceOrderDetail(page, () => fixtures.serviceOrder);
  await interceptApiMethod(
    page,
    `/service-orders/${fixtures.serviceOrder.id}/status`,
    'PATCH',
    { statusCode: 500, message: 'DATABASE_URL-secret' },
    500,
  );

  await page.goto(`/inicio/ordens-servico/${fixtures.serviceOrder.id}?mode=operate`);
  await page.getByRole('combobox', { name: 'Novo status da OS' }).click();
  await page.getByRole('option', { name: 'Em andamento', exact: true }).click();
  await page.getByRole('button', { name: 'Atualizar status', exact: true }).click();

  await expect(page.getByText('Não foi possível processar a solicitação.')).toBeVisible();
  await expect(page.getByText('DATABASE_URL-secret')).toHaveCount(0);
});

test('devolve peça auditável pela tela da OS sem alterar comissão', async ({ page }) => {
  await authenticated(page);
  const part = {
    id: 'part-e2e-1',
    serviceOrderId: fixtures.serviceOrder.id,
    inventoryItemId: 'inventory-e2e-1',
    quantity: 2,
    unitPrice: 40,
    totalPrice: 80,
    closedAt: null,
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-01T12:00:00.000Z',
    inventoryItem: { id: 'inventory-e2e-1', name: 'Peça Sintética', internalCode: 'SYN-001' },
  };
  await interceptServiceOrderDetail(page, () => ({ ...fixtures.serviceOrder, parts: [part] }));
  await interceptApi(
    page,
    `/service-orders/${fixtures.serviceOrder.id}/parts/${part.id}/returnable-consumptions`,
    [{ id: 'movement-e2e-1', quantityConsumed: 2, quantityReturned: 0, quantityAvailable: 2, createdAt: '2026-01-01T12:00:00.000Z' }],
  );
  await interceptApiMethod(
    page,
    `/service-orders/${fixtures.serviceOrder.id}/parts/${part.id}/returns`,
    'POST',
    { part, movement: { id: 'return-e2e-1' }, idempotent: false },
    201,
  );

  await page.goto(`/inicio/ordens-servico/${fixtures.serviceOrder.id}?mode=operate`);
  await page.getByRole('button', { name: 'Remover Peça Sintética da OS' }).click();
  await expect(page.getByText('Remover peça da OS')).toBeVisible();
  await expect(page.getByText(/não altera a comissão/i)).toBeVisible();
  await page.getByLabel('Motivo').fill('Devolução de teste');
  const requestPromise = page.waitForRequest((request) =>
    request.method() === 'POST' && request.url().includes(`/api/v1/service-orders/${fixtures.serviceOrder.id}/parts/${part.id}/returns`),
  );
  await page.getByRole('button', { name: 'Confirmar devolução' }).click();
  const request = await requestPromise;
  expect(request.postDataJSON()).toEqual({ consumptionMovementId: 'movement-e2e-1', quantity: 1, reason: 'Devolução de teste' });
  await expect(page.getByText('Peça devolvida ao estoque. A comissão não foi alterada.')).toBeVisible();
});

test('bloqueia visualmente a OS para perfil financeiro', async ({ page }) => {
  await authenticated(page, 'FINANCEIRO');

  await page.goto('/inicio/ordens-servico');

  await expect(page.getByRole('heading', { name: 'Acesso não autorizado' })).toBeVisible();
  await expect(page.getByText('Seu perfil não possui permissão para acessar este módulo.')).toBeVisible();
});
