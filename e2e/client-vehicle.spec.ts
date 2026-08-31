import { expect, test } from '@playwright/test';
import { futureFlowFixtures, interceptApi, syntheticSession } from './fixtures/api';

async function authenticated(page: import('@playwright/test').Page) {
  await page.route('**/auth/refresh', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(syntheticSession()) }));
}

test('lista cliente sintético e não mistura tenant visualmente', async ({ page }) => {
  await authenticated(page);
  await interceptApi(page, '/clients', futureFlowFixtures.clients());
  await page.goto('/inicio/clientes');
  await expect(page.getByText('Cliente Sintético')).toBeVisible();
  await expect(page.getByText('tenant-e2e-b')).toHaveCount(0);
});

test('estado vazio de clientes é visível', async ({ page }) => {
  await authenticated(page);
  await interceptApi(page, '/clients', futureFlowFixtures.clients().data.length ? { ...futureFlowFixtures.clients(), data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } } : futureFlowFixtures.clients());
  await page.goto('/inicio/clientes');
  await expect(page.getByText('Nenhum registro encontrado').first()).toBeVisible();
});

test('lista veículo associado ao cliente sintético', async ({ page }) => {
  await authenticated(page);
  await interceptApi(page, '/vehicles', futureFlowFixtures.vehicles());
  await page.goto('/inicio/veiculos');
  await expect(page.getByText('SYN-0E00')).toBeVisible();
  await expect(page.getByText('Cliente Sintético')).toBeVisible();
});
