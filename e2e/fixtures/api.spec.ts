import { expect, test } from '@playwright/test';
import { fixtures, paginated, syntheticSession } from './api';

test('fixtures são determinísticas, sem PII e isoladas por tenant e papel', () => {
  const adminA = syntheticSession('ADMIN', 'tenant-e2e-a');
  const financialB = syntheticSession('FINANCEIRO', 'tenant-e2e-b');
  expect(adminA.user.workshopId).not.toBe(financialB.user.workshopId);
  expect(adminA.user.role).toBe('ADMIN');
  expect(fixtures.client.document).toBeNull();
  expect(fixtures.client.email).toBeNull();
  expect(fixtures.client.phone).toBeNull();
  expect(fixtures.serviceOrder.status).toBe('ABERTA');
  expect(fixtures.financial.status).toBe('VENCIDO');
});

test('helper de paginação preserva contrato esperado pela UI', () => {
  expect(paginated([fixtures.client])).toEqual(expect.objectContaining({ data: [fixtures.client], meta: expect.objectContaining({ total: 1, page: 1 }) }));
});
