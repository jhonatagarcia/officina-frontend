import { expect, test } from '@playwright/test';
import {
  interceptApi,
  interceptApiMethod,
  fulfillJson,
  paginated,
  syntheticSession,
} from './fixtures/api';

const linkedUserId = '11111111-1111-4111-8111-111111111111';
const linkedUser = {
  id: linkedUserId,
  name: 'Conta Mecanico Sintetica',
  email: 'mecanico@example.test',
  role: 'MECANICO',
  isActive: true,
  lastLoginAt: null,
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
};

async function authenticated(page: import('@playwright/test').Page) {
  await page.route('**/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(syntheticSession('ADMIN')),
    }),
  );
}

async function prepareForm(page: import('@playwright/test').Page) {
  await authenticated(page);
  await interceptApi(page, '/users', paginated([linkedUser]));
  await interceptApi(page, '/employees', paginated([]));
}

test('cria funcionario sem acesso pelo contrato Employee', async ({ page }) => {
  await prepareForm(page);
  await interceptApiMethod(
    page,
    '/employees',
    'POST',
    {
      id: 'employee-e2e-without-access',
      name: 'Funcionario Sem Acesso',
      function: 'MECHANIC',
      isActive: true,
      hasAccess: false,
      user: null,
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-01T12:00:00.000Z',
    },
    201,
  );

  await page.goto('/inicio/mecanicos/novo');
  await expect(
    page.getByText(/nao cria acesso nem deixa uma conta pronta para login/i),
  ).toBeVisible();
  await page.getByLabel('Nome completo').fill('Funcionario Sem Acesso');

  const requestPromise = page.waitForRequest(
    (request) =>
      request.method() === 'POST' &&
      request.url().includes('/api/v1/employees'),
  );
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  const request = await requestPromise;

  expect(request.postDataJSON()).toEqual({
    name: 'Funcionario Sem Acesso',
    function: 'MECHANIC',
    isActive: true,
  });
  expect(request.url()).not.toContain('/mechanics');
});

test('vincula conta MECANICO existente sem prometer criacao ou senha', async ({
  page,
}) => {
  await prepareForm(page);
  await interceptApiMethod(
    page,
    '/employees',
    'POST',
    {
      id: 'employee-e2e-linked',
      name: 'Funcionario Com Acesso',
      function: 'MECHANIC',
      isActive: true,
      hasAccess: true,
      user: linkedUser,
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-01T12:00:00.000Z',
    },
    201,
  );

  await page.goto('/inicio/mecanicos/novo');
  await page.getByLabel('Nome completo').fill('Funcionario Com Acesso');
  await page.getByRole('combobox').nth(1).click();
  await page.getByRole('option', { name: /Conta Mecanico Sintetica/ }).click();

  const requestPromise = page.waitForRequest(
    (request) =>
      request.method() === 'POST' &&
      request.url().includes('/api/v1/employees'),
  );
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  const request = await requestPromise;

  expect(request.postDataJSON()).toEqual({
    name: 'Funcionario Com Acesso',
    function: 'MECHANIC',
    isActive: true,
    userId: linkedUserId,
  });
  await expect(page.getByText(/cria senha/i)).toHaveCount(0);
  await expect(page.getByText(/acesso liberado/i)).toHaveCount(0);
});

test('ADMIN cria User MECANICO e depois vincula a um Employee', async ({ page }) => {
  await authenticated(page);
  let accountCreated = false;
  let employeeRequestBody: unknown;

  await page.route('**/api/v1/users*', async (route) => {
    if (route.request().method() === 'POST') {
      accountCreated = true;
      await fulfillJson(route, linkedUser, 201);
      return;
    }
    await fulfillJson(route, paginated(accountCreated ? [linkedUser] : []));
  });
  await page.route('**/api/v1/employees*', async (route) => {
    if (route.request().method() === 'POST') {
      employeeRequestBody = route.request().postDataJSON();
      await fulfillJson(
        route,
        {
          id: 'employee-e2e-linked-after-account',
          name: 'Linked synthetic employee',
          function: 'MECHANIC',
          isActive: true,
          hasAccess: true,
          user: linkedUser,
          createdAt: '2026-01-01T12:00:00.000Z',
          updatedAt: '2026-01-01T12:00:00.000Z',
        },
        201,
      );
      return;
    }
    await fulfillJson(route, paginated([]));
  });

  await page.goto('/inicio/usuarios');
  await page.getByRole('button', { name: 'Nova conta' }).click();
  await expect(page.getByText(/não gera senha automática/i)).toBeVisible();
  await page.getByLabel('Nome').fill(linkedUser.name);
  await page.getByLabel('E-mail').fill(linkedUser.email);
  await page.getByLabel('Senha inicial').fill('SyntheticPassword123!');
  await page.getByLabel('Confirmar senha').fill('SyntheticPassword123!');

  const createAccountRequest = page.waitForRequest(
    (request) =>
      request.method() === 'POST' && request.url().includes('/api/v1/users'),
  );
  await page.getByRole('button', { name: 'Criar conta' }).click();
  const accountRequest = await createAccountRequest;
  expect(accountRequest.postDataJSON()).toMatchObject({
    role: 'MECANICO',
    isActive: true,
  });

  const eligibleAccountsRequest = page.waitForRequest((request) => {
    const requestUrl = new URL(request.url());
    return (
      request.method() === 'GET' &&
      requestUrl.pathname.endsWith('/api/v1/users') &&
      requestUrl.searchParams.get('role') === 'MECANICO' &&
      requestUrl.searchParams.get('active') === 'true' &&
      requestUrl.searchParams.get('eligibleForEmployee') === 'true'
    );
  });
  await page.goto('/inicio/mecanicos/novo');
  await eligibleAccountsRequest;
  await page.getByLabel('Nome completo').fill('Linked synthetic employee');
  await page.getByRole('combobox').nth(1).click();
  await page.getByRole('option', { name: /Conta Mecanico Sintetica/ }).click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();

  await expect.poll(() => employeeRequestBody).not.toBeUndefined();
  expect(employeeRequestBody).toMatchObject({ userId: linkedUserId });
});
