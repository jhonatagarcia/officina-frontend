import type { Page, Route } from '@playwright/test';

export type SyntheticRole = 'ADMIN' | 'ATENDENTE' | 'MECANICO' | 'FINANCEIRO';

const now = '2026-01-01T12:00:00.000Z';

export function syntheticSession(role: SyntheticRole = 'ADMIN', tenant = 'tenant-e2e-a') {
  return {
    accessToken: `synthetic-${tenant}-${role.toLowerCase()}`,
    user: { id: `user-${tenant}-${role.toLowerCase()}`, name: 'Usuário Sintético', email: null, role, workshopId: tenant },
  };
}

export const fixtures = {
  client: { id: 'client-e2e-1', name: 'Cliente Sintético', document: null, phone: null, email: null, notes: null, isActive: true, createdAt: now, updatedAt: now },
  vehicle: { id: 'vehicle-e2e-1', clientId: 'client-e2e-1', plate: 'SYN0E00', brand: 'Marca Sintética', model: 'Modelo Sintético', year: 2026, color: null, mileage: null, fuel: null, notes: null, createdAt: now, updatedAt: now },
  serviceOrder: { id: 'os-e2e-1', orderNumber: 'OS-E2E-001', budgetId: null, clientId: 'client-e2e-1', vehicleId: 'vehicle-e2e-1', mechanicId: null, clientName: 'Cliente Sintético', vehicleLabel: 'SYN0E00', mechanicName: null, problemDescription: 'Diagnóstico sintético', diagnosis: null, servicesPerformed: null, vehicleChecklist: null, openedAt: now, expectedDeliveryAt: null, finishedAt: null, deliveredAt: null, status: 'ABERTA', notes: null, createdAt: now, updatedAt: now, client: { id: 'client-e2e-1', name: 'Cliente Sintético', document: null, phone: null }, vehicle: { id: 'vehicle-e2e-1', plate: 'SYN0E00', brand: 'Marca Sintética', model: 'Modelo Sintético', year: 2026 } },
  budget: { id: 'budget-e2e-1', code: 'ORC-E2E-001', clientId: 'client-e2e-1', vehicleId: 'vehicle-e2e-1', status: 'APROVADO', problemDescription: 'Diagnóstico sintético', notes: null, subtotal: 100, discount: 0, total: 100, convertedToServiceOrder: false, approvedAt: now, rejectedAt: null, createdAt: now, updatedAt: now, items: [], client: { id: 'client-e2e-1', name: 'Cliente Sintético', document: null }, vehicle: { id: 'vehicle-e2e-1', plate: 'SYN0E00', brand: 'Marca Sintética', model: 'Modelo Sintético', year: 2026 }, serviceOrder: null },
  financial: { id: 'financial-e2e-1', type: 'RECEIVABLE', description: 'Lançamento vencido sintético', category: 'Teste', amount: 100, dueDate: now, paidAt: null, paymentMethod: null, status: 'VENCIDO', clientId: 'client-e2e-1', serviceOrderId: 'os-e2e-1', notes: null, createdAt: now, updatedAt: now, client: { id: 'client-e2e-1', name: 'Cliente Sintético', document: null }, serviceOrder: { id: 'os-e2e-1', orderNumber: 'OS-E2E-001', status: 'ABERTA' } },
  financialOpen: { id: 'financial-e2e-2', type: 'RECEIVABLE', description: 'Lançamento em aberto sintético', category: 'Teste', amount: 200, dueDate: now, paidAt: null, paymentMethod: null, status: 'EM_ABERTO', clientId: 'client-e2e-1', serviceOrderId: null, notes: null, createdAt: now, updatedAt: now, client: { id: 'client-e2e-1', name: 'Cliente Sintético', document: null }, serviceOrder: null },
  financialPaid: { id: 'financial-e2e-3', type: 'PAYABLE', description: 'Lançamento pago sintético', category: 'Teste', amount: 300, dueDate: now, paidAt: now, paymentMethod: 'PIX', status: 'PAGO', clientId: null, serviceOrderId: null, notes: null, createdAt: now, updatedAt: now, client: null, serviceOrder: null },
} as const;

export function paginated<T>(data: T[]) {
  return { data, meta: { page: 1, limit: 20, total: data.length, totalPages: 1 } };
}

export async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

type ApiFixtureBody = unknown | ((route: Route) => unknown | Promise<unknown>);

async function resolveFixtureBody(route: Route, body: ApiFixtureBody): Promise<unknown> {
  return typeof body === 'function' ? body(route) : body;
}

export async function interceptApi(page: Page, path: string, body: ApiFixtureBody, status = 200): Promise<void> {
  await page.route(`**/api/v1${path}*`, async (route) => fulfillJson(route, await resolveFixtureBody(route, body), status));
}

export async function interceptApiMethod(
  page: Page,
  path: string,
  method: string,
  body: ApiFixtureBody,
  status = 200,
): Promise<void> {
  await page.route(`**/api/v1${path}*`, async (route) => {
    if (route.request().method() !== method) {
      await route.fallback();
      return;
    }

    await fulfillJson(route, await resolveFixtureBody(route, body), status);
  });
}

export async function interceptApiError(page: Page, path: string, status = 403): Promise<void> {
  await interceptApi(page, path, { statusCode: status, message: 'Operação não permitida' }, status);
}

export const futureFlowFixtures = {
  clients: () => paginated([fixtures.client]),
  vehicles: () => paginated([{ ...fixtures.vehicle, client: { id: fixtures.client.id, name: fixtures.client.name, document: null, phone: null, email: null } }]),
  serviceOrders: () => paginated([fixtures.serviceOrder]),
  budgets: () => paginated([fixtures.budget]),
  financial: () => paginated([fixtures.financialOpen, fixtures.financialPaid, fixtures.financial]),
};
