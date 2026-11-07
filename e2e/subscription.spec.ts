import { expect, test } from '@playwright/test';
import {
  interceptApi,
  interceptApiMethod,
  syntheticSession,
} from './fixtures/api';

const plan = {
  code: 'ESSENTIAL',
  name: 'Essencial',
  description: 'Plano inicial do AutoPro System',
  entitlements: { fullV1Access: true, workshops: 1, billingVersion: 1 },
  prices: [
    {
      id: 'price-e2e-1',
      amount: 79.9,
      currency: 'BRL',
      cycle: 'MONTHLY',
    },
  ],
};

const trialSubscription = {
  accessMode: 'FULL',
  status: 'TRIALING',
  trialEndsAt: '2026-09-09T12:00:00.000Z',
  currentPeriodStart: null,
  currentPeriodEnd: null,
  graceEndsAt: null,
  cancelAtPeriodEnd: false,
  billingEnabled: true,
  provider: 'ASAAS',
  environment: 'SANDBOX',
  plan: null,
};

const expiredSubscription = {
  ...trialSubscription,
  accessMode: 'LIMITED',
  status: 'EXPIRED',
  trialEndsAt: '2026-08-01T12:00:00.000Z',
};

async function authenticatedAdmin(page: import('@playwright/test').Page) {
  await page.route('**/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(syntheticSession('ADMIN')),
    }),
  );
}

test('admin visualiza preço real e inicia checkout Pix sem liberar acesso localmente', async ({
  page,
}) => {
  await authenticatedAdmin(page);
  await interceptApi(page, '/billing/plans', [plan]);
  await interceptApi(page, '/billing/subscription', trialSubscription);
  await interceptApiMethod(page, '/billing/checkouts', 'POST', {
    id: 'checkout-e2e-1',
    link: 'http://127.0.0.1:4174/inicio/assinatura?checkout=cancel',
    status: 'ACTIVE',
    expiresAt: '2026-08-27T12:00:00.000Z',
    kind: 'ONE_TIME',
    billingType: 'PIX',
    accessChangesOnlyAfterWebhook: true,
  });

  await page.goto('/inicio/assinatura');

  await expect(page.getByText('Plano Essencial')).toBeVisible();
  await expect(page.getByText('R$ 79,90')).toBeVisible();
  await expect(
    page.getByRole('main').getByText('Período gratuito', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Sandbox: pagamentos são apenas simulações/),
  ).toBeVisible();

  const checkoutRequest = page.waitForRequest(
    (request) =>
      request.method() === 'POST' &&
      request.url().includes('/api/v1/billing/checkouts'),
  );
  await page.getByRole('button', { name: 'Pagar um mês com Pix' }).click();

  expect((await checkoutRequest).postDataJSON()).toEqual({
    billingType: 'PIX',
    planCode: 'ESSENTIAL',
  });
});

test('oficina piloto permanece isenta e não inicia checkout', async ({ page }) => {
  await authenticatedAdmin(page);
  await interceptApi(page, '/billing/plans', [plan]);
  await interceptApi(page, '/billing/subscription', {
    ...trialSubscription,
    status: 'PILOT',
    trialEndsAt: null,
  });

  await page.goto('/inicio/assinatura');

  await expect(page.getByRole('main').getByText('Oficina piloto')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Assinar com cartão' }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Pagar um mês com Pix' }),
  ).toBeDisabled();
});

test('teste expirado mantém apenas clientes e veículos em modo de consulta', async ({ page }) => {
  await authenticatedAdmin(page);
  await interceptApi(page, '/billing/subscription', expiredSubscription);
  await interceptApi(page, '/clients', {
    data: [
      {
        id: 'client-limited-1',
        name: 'Cliente somente consulta',
        document: null,
        phone: null,
        email: null,
        notes: null,
        isActive: true,
        createdAt: '2026-01-01T12:00:00.000Z',
        updatedAt: '2026-01-01T12:00:00.000Z',
      },
    ],
    meta: { page: 1, limit: 5, total: 1, totalPages: 1 },
  });

  await page.goto('/inicio/dashboard');
  await expect(page).toHaveURL(/\/inicio\/clientes$/);
  await expect(page.getByText('Cliente somente consulta')).toBeVisible();
  await expect(page.getByText(/período gratuito terminou/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Novo cliente' }).first()).toBeDisabled();
  await expect(page.getByRole('link', { name: 'Financeiro' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Clientes' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Veículos' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Assinatura', exact: true })).toBeVisible();
});
