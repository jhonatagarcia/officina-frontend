import { describe, expect, it, vi } from 'vitest';
import { budgetsService, type SaveBudgetPayload } from '@/features/budgets/services/budgets-service';
import { http } from '@/services/api/http';

vi.mock('@/services/api/http', () => ({
  http: {
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

const payload: SaveBudgetPayload = {
  clientId: 'client-1',
  vehicleId: 'vehicle-1',
  problemDescription: 'Ruido na suspensao',
  discount: 10,
  items: [
    {
      type: 'LABOR',
      serviceCatalogItemId: 'service-1',
      description: 'Inspecao',
      quantity: 1,
      unitPrice: 100,
    },
  ],
};

describe('budgetsService', () => {
  it('atualiza orçamento pendente pelo endpoint de edição', async () => {
    vi.mocked(http.patch).mockResolvedValueOnce({
      data: {
        id: 'budget-1',
        code: 'ORC-001',
        clientId: 'client-1',
        vehicleId: 'vehicle-1',
        status: 'PENDENTE',
        problemDescription: 'Ruido na suspensao',
        notes: null,
        subtotal: '100',
        discount: '10',
        total: '90',
        convertedToServiceOrder: false,
        approvedAt: null,
        rejectedAt: null,
        createdAt: '2026-05-25T00:00:00.000Z',
        updatedAt: '2026-05-25T00:00:00.000Z',
        items: [],
      },
    });

    const result = await budgetsService.update('budget-1', payload);

    expect(http.patch).toHaveBeenCalledWith('/budgets/budget-1', payload);
    expect(result.total).toBe(90);
  });
});
