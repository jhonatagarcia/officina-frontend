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
  serviceOrder: { id: 'os-e2e-1', orderNumber: 'OS-E2E-001', budgetId: null, clientId: 'client-e2e-1', vehicleId: 'vehicle-e2e-1', mechanicId: null, clientName: 'Cliente Sintético', vehicleLabel: 'SYN0E00', mechanicName: null, problemDescription: 'Diagnóstico sintético', diagnosis: null, servicesPerformed: null, vehicleChecklist: null, openedAt: now, expectedDeliveryAt: null, finishedAt: null, deliveredAt: null, status: 'ABERTA', notes: null, createdAt: now, updatedAt: now },
  financial: { id: 'financial-e2e-1', type: 'RECEIVABLE', description: 'Lançamento sintético', category: 'Teste', amount: 100, dueDate: now, paidAt: null, paymentMethod: null, status: 'VENCIDO', clientId: 'client-e2e-1', serviceOrderId: 'os-e2e-1', notes: null, createdAt: now, updatedAt: now, client: { id: 'client-e2e-1', name: 'Cliente Sintético', document: null }, serviceOrder: { id: 'os-e2e-1', orderNumber: 'OS-E2E-001', status: 'ABERTA' } },
} as const;

export function paginated<T>(data: T[]) {
  return { data, meta: { page: 1, limit: 20, total: data.length, totalPages: 1 } };
}

export async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

export async function interceptApi(page: Page, path: string, body: unknown, status = 200): Promise<void> {
  await page.route(`**/api/v1${path}*`, (route) => fulfillJson(route, body, status));
}

export async function interceptApiError(page: Page, path: string, status = 403): Promise<void> {
  await interceptApi(page, path, { statusCode: status, message: 'Operação não permitida' }, status);
}

export const futureFlowFixtures = {
  clients: () => paginated([fixtures.client]),
  vehicles: () => paginated([{ ...fixtures.vehicle, client: { id: fixtures.client.id, name: fixtures.client.name, document: null, phone: null, email: null } }]),
  serviceOrders: () => paginated([fixtures.serviceOrder]),
  financial: () => paginated([fixtures.financial]),
};
