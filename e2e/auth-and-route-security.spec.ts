import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/auth/refresh', (route) => route.fulfill({ status: 401, body: JSON.stringify({ message: 'Sessão inválida' }) }));
});

test('redireciona rota protegida sem sessão para login', async ({ page }) => {
  await page.goto('/inicio/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

test('exibe erro de login sem vazar detalhes internos', async ({ page }) => {
  await page.route('**/auth/login', (route) => route.fulfill({ status: 401, body: JSON.stringify({ message: 'DATABASE_URL=secret' }) }));
  await page.goto('/login');
  await page.getByLabel(/e-mail/i).fill('synthetic@example.test');
  await page.getByLabel(/senha/i).fill('senha-sintetica');
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page.getByText(/usuário não cadastrado ou senha inválida/i)).toBeVisible();
  await expect(page.getByText(/DATABASE_URL/i)).toHaveCount(0);
});
