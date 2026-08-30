import { expect, test } from '@playwright/test';
import { interceptApi, interceptApiMethod } from './fixtures/api';

test.beforeEach(async ({ page }) => {
  await page.route('**/auth/refresh', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Sessão inválida' }),
    }),
  );
});

test('modo privado oculta o cadastro público', async ({ page }) => {
  await interceptApi(page, '/auth/signup/config', {
    mode: 'invite_only',
    publicRegistrationEnabled: false,
    invitationRequired: true,
  });

  await page.goto('/login');

  await expect(
    page.getByRole('heading', { name: 'Entrar na sua conta' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Cadastre-se' }),
  ).toHaveCount(0);
});

test('convite válido é removido da URL e abre o cadastro vinculado', async ({
  page,
}) => {
  const token = 'token-sintetico-nao-persistido';
  await interceptApi(page, '/auth/signup/config', {
    mode: 'invite_only',
    publicRegistrationEnabled: false,
    invitationRequired: true,
  });
  await interceptApiMethod(
    page,
    '/auth/signup-invites/validate',
    'POST',
    (route) => {
      expect(route.request().postDataJSON()).toEqual({ token });
      return {
        valid: true,
        maskedEmail: 'p***@example.test',
        expiresAt: '2026-08-30T12:00:00.000Z',
      };
    },
  );

  await page.goto(`/login#invite=${token}`);

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByText(/convite validado para p\*\*\*@example\.test/i),
  ).toBeVisible();
});
