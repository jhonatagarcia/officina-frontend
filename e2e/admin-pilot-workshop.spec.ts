import { expect, test } from '@playwright/test';

const pilotCandidate = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Oficina Parceira',
  tradeName: 'Oficina Parceira',
  ownerName: 'Responsavel Sintetico',
  email: 'piloto@example.test',
  plan: 'TRIALING',
  status: 'TRIALING',
  isActive: true,
  createdAt: '2026-08-29T12:00:00.000Z',
  usersCount: 1,
  serviceOrdersCount: 0,
};

test('Admin Master define a oficina piloto permanente com justificativa', async ({
  page,
}) => {
  await page.route('**/api/v1/admin/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'synthetic-admin-master-token',
        user: {
          id: 'admin-master',
          name: 'Admin Master',
          email: 'admin@example.test',
          role: 'ADMIN',
          adminRole: 'SUPER_ADMIN',
        },
      }),
    }),
  );
  await page.route('**/api/v1/admin/support/summary', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"active":0}' }),
  );
  await page.route('**/api/v1/admin/logs/summary', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"critical":0}' }),
  );
  await page.route('**/api/v1/admin/tenants**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [pilotCandidate],
        meta: { total: 1, page: 1, limit: 20, pages: 1 },
      }),
    }),
  );

  let pilotRequest: { reason?: string } | undefined;
  await page.route(
    `**/api/v1/admin/billing/workshops/${pilotCandidate.id}/pilot`,
    async (route) => {
      pilotRequest = route.request().postDataJSON() as { reason?: string };
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'PILOT' }),
      });
    },
  );

  await page.goto('/admin/login');
  await page.getByLabel('E-mail').fill('admin@example.test');
  await page.getByLabel('Senha').fill('senha-sintetica');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('link', { name: 'Negócios' }).click();

  await page
    .getByRole('button', { name: 'Definir Oficina Parceira como oficina piloto' })
    .click();
  await page.getByLabel('Justificativa').fill('Oficina parceira do programa piloto');
  await page.getByRole('button', { name: 'Confirmar oficina piloto' }).click();

  await expect.poll(() => pilotRequest?.reason).toBe('Oficina parceira do programa piloto');
  await expect(page.getByText('Oficina definida como piloto permanente')).toBeVisible();
});
