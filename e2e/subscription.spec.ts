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
  entitlements: { includedUsers: 5 },
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
