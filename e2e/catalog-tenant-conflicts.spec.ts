import { expect, test, type Browser, type Page, type Response } from '@playwright/test';
import { fulfillJson, paginated, syntheticSession } from './fixtures/api';

type Resource = 'inventory' | 'services';

const now = '2026-01-01T12:00:00.000Z';

async function createTenantPage(
  browser: Browser,
  tenant: string,
  resource: Resource,
  recordsByTenant: Map<string, Set<string>>,
) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();

    if (url.pathname.endsWith('/auth/refresh')) {
      await fulfillJson(route, syntheticSession('ADMIN', tenant));
      return;
    }

    if (url.pathname.endsWith('/workshop/profile')) {
      await fulfillJson(route, {
        id: `workshop-${tenant}`,
        tradeName: 'Oficina Sintetica',
      });
      return;
    }

    if (!url.pathname.endsWith(`/api/v1/${resource}`)) {
      await fulfillJson(route, paginated([]));
      return;
    }

    if (method === 'GET') {
      await fulfillJson(route, paginated([]));
      return;
    }

    const tenantRecords = recordsByTenant.get(tenant) ?? new Set<string>();
    recordsByTenant.set(tenant, tenantRecords);
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    const key =
      resource === 'services'
        ? `${String(payload.name).trim().toLocaleLowerCase()}::${String(payload.category)
            .trim()
            .toLocaleLowerCase()}`
        : 'SYN-INVENTORY-001';

    if (tenantRecords.has(key)) {
      await fulfillJson(
        route,
        resource === 'services'
          ? {
              statusCode: 409,
              message:
                'Ja existe um servico com este nome na categoria informada nesta oficina',
              code: 'SERVICE_NAME_CATEGORY_CONFLICT',
              field: 'name',
            }
          : {
              statusCode: 409,
              message:
                'Ja existe um item de estoque com este codigo interno nesta oficina',
              code: 'INVENTORY_INTERNAL_CODE_CONFLICT',
              field: 'internalCode',
            },
        409,
      );
      return;
    }

    tenantRecords.add(key);
    await fulfillJson(
      route,
      resource === 'services'
        ? {
            id: `service-${tenant}`,
            code: 'SYN-SERVICE-001',
            name: payload.name,
            category: payload.category,
            description: null,
            internalNotes: null,
            laborPrice: payload.laborPrice,
            productPrice: 0,
            suggestedTotalPrice: payload.laborPrice,
            billingType: payload.billingType,
            materialSource: payload.materialSource,
            warrantyDays: null,
            active: true,
            createdAt: now,
            updatedAt: now,
          }
        : {
            id: `inventory-${tenant}`,
            internalCode: 'SYN-INVENTORY-001',
            name: payload.name,
            category: payload.category ?? null,
            supplier: payload.supplier ?? null,
            quantity: payload.quantity,
            minimumQuantity: payload.minimumQuantity,
            cost: payload.cost,
            salePrice: payload.salePrice,
            createdAt: now,
            updatedAt: now,
          },
      201,
    );
  });

  return { context, page };
}

async function submitEquivalentService(page: Page) {
  await page.goto('/inicio/servicos/novo');
  await page.getByLabel('Nome do serviço').fill('Servico Equivalente Sintetico');
  await page.getByLabel('Categoria').fill('Categoria Sintetica');
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/api/v1/services'),
  );
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  return responsePromise;
}

async function submitEquivalentInventory(page: Page) {
  await page.goto('/inicio/estoque/novo');
  await page.getByLabel(/Nome da peça/i).fill('Peca Equivalente Sintetica');
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/api/v1/inventory'),
  );
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  return responsePromise;
}

async function runTenantScenario(
  browser: Browser,
  resource: Resource,
  submit: (page: Page) => Promise<Response>,
  expectedConflict: RegExp,
) {
  const recordsByTenant = new Map<string, Set<string>>();
  const firstTenant = await createTenantPage(browser, 'tenant-a', resource, recordsByTenant);
  const secondTenant = await createTenantPage(browser, 'tenant-b', resource, recordsByTenant);
  const repeatedTenant = await createTenantPage(browser, 'tenant-a', resource, recordsByTenant);

  try {
    const firstResponse = await submit(firstTenant.page);
    const secondResponse = await submit(secondTenant.page);
    expect(firstResponse.status()).toBe(201);
    expect(secondResponse.status()).toBe(201);

    const conflictResponse = await submit(repeatedTenant.page);
    expect(conflictResponse.status()).toBe(409);
    await expect(repeatedTenant.page.getByText(expectedConflict)).toBeVisible();
  } finally {
    await firstTenant.context.close();
    await secondTenant.context.close();
    await repeatedTenant.context.close();
  }
}

test('aceita servicos equivalentes entre tenants e marca nome apenas na duplicata local', async ({
  browser,
}) => {
  await runTenantScenario(
    browser,
    'services',
    submitEquivalentService,
    /nome na categoria informada nesta oficina/i,
  );
});

test('aceita itens equivalentes entre tenants e mostra conflito seguro de codigo local', async ({
  browser,
}) => {
  await runTenantScenario(
    browser,
    'inventory',
    submitEquivalentInventory,
    /codigo interno nesta oficina/i,
  );
});
