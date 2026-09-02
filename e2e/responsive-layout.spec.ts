import { expect, test, type Page } from '@playwright/test';
import {
  fixtures,
  interceptApi,
  paginated,
  syntheticSession,
} from './fixtures/api';

const workshopProfile = {
  id: 'tenant-responsive',
  tradeName: 'Oficina Responsiva',
  cnpj: null,
  isActive: true,
  fiscalProfile: {
    status: 'INCOMPLETE',
    hasCnpj: false,
    canUseFiscalFeatures: false,
    blockingReason: 'CNPJ ausente',
  },
};

const subscription = {
  status: 'TRIALING',
  trialEndsAt: '2026-09-30T12:00:00.000Z',
  currentPeriodStart: null,
  currentPeriodEnd: null,
  graceEndsAt: null,
  cancelAtPeriodEnd: false,
  billingEnabled: true,
  provider: 'ASAAS',
  environment: 'SANDBOX',
  plan: null,
};

async function prepareAuthenticatedWorkspace(page: Page) {
  await page.route('**/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(syntheticSession('ADMIN', 'tenant-responsive')),
    }),
  );
  await interceptApi(page, '/workshop/profile', workshopProfile);
  await interceptApi(page, '/billing/subscription', subscription);
  await interceptApi(page, '/users', paginated([]));
  await interceptApi(page, '/employees', paginated([]));
}

async function prepareDashboard(page: Page) {
  const lowStockItem = {
    id: 'inventory-responsive',
    name: 'Peça com nome extenso para validar adaptação do conteúdo',
    internalCode: 'PEC-RESP-001',
    category: 'Suspensão',
    supplier: 'Fornecedor sintético',
    quantity: 1,
    minimumQuantity: 5,
    cost: '75.00',
    salePrice: '120.00',
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-01T12:00:00.000Z',
  };
  const serviceOrder = {
    ...fixtures.serviceOrder,
    total: '1250.00',
    mechanic: null,
    parts: [],
    budgetItems: [],
  };
  const pendingBudget = {
    ...fixtures.budget,
    status: 'PENDENTE',
  };

  await interceptApi(page, '/dashboard/summary', {
    serviceOrders: { open: 1, inProgress: 0, readyForDelivery: 0 },
    budgets: { pending: 1 },
    clients: { total: 1, new: 1, returnRate: 0 },
    financial: {
      monthRevenue: '1250.00',
      stockOutValue: '120.00',
      netBalanceValue: '1130.00',
      pendingServiceOrderPaymentsValue: '1250.00',
      averageTicket: '1250.00',
    },
    inventory: {
      lowStockCount: 1,
      lowStockItems: [lowStockItem],
    },
    operational: { averageExecutionDays: '1.5' },
    workforce: { activeEmployees: 1 },
  });
  await interceptApi(page, '/inventory/alerts/low-stock', [lowStockItem]);
  await interceptApi(page, '/service-orders', (route) => {
    const status = new URL(route.request().url()).searchParams.get('status');
    return paginated(status === 'ABERTA' ? [serviceOrder] : []);
  });
  await interceptApi(page, '/budgets', paginated([pendingBudget]));
}

async function expectNoDocumentOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
}

async function expectNoOverlap(page: Page, selectors: string[]) {
  const boxes = await Promise.all(
    selectors.map(async (selector) => {
      const locator = page.locator(selector);
      await expect(locator).toBeVisible();
      return locator.boundingBox();
    }),
  );

  for (let current = 0; current < boxes.length; current += 1) {
    for (let compared = current + 1; compared < boxes.length; compared += 1) {
      const first = boxes[current];
      const second = boxes[compared];
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();

      const overlaps =
        first!.x < second!.x + second!.width &&
        first!.x + first!.width > second!.x &&
        first!.y < second!.y + second!.height &&
        first!.y + first!.height > second!.y;

      expect(overlaps).toBe(false);
    }
  }
}

for (const viewport of [
  { name: 'celular', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
]) {
  test(`workspace usa menu lateral compacto em ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await prepareAuthenticatedWorkspace(page);
    await page.goto('/inicio/mecanicos/novo');

    await expect(page.getByRole('heading', { name: 'Novo mecânico' })).toBeVisible();
    await expect(page.locator('#primary-navigation')).toBeHidden();
    await expectNoDocumentOverflow(page);

    await page
      .getByRole('button', { name: 'Abrir menu de navegação' })
      .click();

    await expect(page.locator('#primary-navigation')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Clientes' })).toBeVisible();

    await page
      .getByRole('button', { name: 'Fechar menu', exact: true })
      .click();
    await expect(page.locator('#primary-navigation')).toBeHidden();
    await expectNoDocumentOverflow(page);
  });
}

test('workspace mantém navegação permanente no desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await prepareAuthenticatedWorkspace(page);
  await page.goto('/inicio/mecanicos/novo');

  await expect(page.locator('#primary-navigation')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Abrir menu de navegação' }),
  ).toBeHidden();
  await expectNoDocumentOverflow(page);
});

for (const viewport of [
  { name: 'notebook', width: 1430, height: 840 },
  { name: 'monitor amplo', width: 1920, height: 1080 },
]) {
  test(`cabeçalho reorganiza busca e ações sem sobreposição em ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await prepareAuthenticatedWorkspace(page);
    await interceptApi(page, '/vehicles', paginated([fixtures.vehicle]));
    await page.goto('/inicio/veiculos');

    await expect(page.getByRole('heading', { name: 'Veículos' })).toBeVisible();
    await expectNoOverlap(page, [
      'input[placeholder="Buscar por placa, marca, modelo ou cliente"]',
      'button:has-text("Ajustar painel")',
      'button:has-text("Novo veículo")',
    ]);
    await expectNoDocumentOverflow(page);
  });
}

for (const viewport of [
  { name: 'celular', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'notebook compacto', width: 1024, height: 768 },
]) {
  test(`dashboard adapta indicadores e detalhes em ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await prepareAuthenticatedWorkspace(page);
    await prepareDashboard(page);
    await page.goto('/inicio/dashboard');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Faturamento total').first()).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Ordens em execução' }),
    ).toBeVisible();
    await expect(
      page.getByText('Cliente Sintético').filter({ visible: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText('PEC-RESP-001').filter({ visible: true }).first(),
    ).toBeVisible();
    await expectNoDocumentOverflow(page);

    if (viewport.width < 1024) {
      const floatingMenu = page.getByRole('button', {
        name: 'Abrir menu de navegação',
      });

      await expect(floatingMenu).toBeVisible();
      await expect
        .poll(() =>
          floatingMenu.evaluate((element) => getComputedStyle(element).position),
        )
        .toBe('fixed');

      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      );
      await expect(floatingMenu).toBeVisible();
      await floatingMenu.click();
      await expect(page.locator('#primary-navigation')).toBeVisible();
    }
  });
}
