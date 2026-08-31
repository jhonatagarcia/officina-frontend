import { describe, expect, it, vi } from 'vitest';
import { financialService } from '@/features/financial/services/financial-service';
import { http } from '@/services/api/http';

vi.mock('@/services/api/http', () => ({
  http: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

describe('financialService', () => {
  it('normaliza status e tipo recebidos da API para o padrão da aplicação', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: {
        data: [
          {
            id: '1',
            type: 'receivable',
            description: 'OS 123',
            category: 'SERVICO',
            amount: '150.50',
            dueDate: '2026-04-10T00:00:00.000Z',
            paidAt: null,
            paymentMethod: null,
            status: 'pending',
            clientId: null,
            serviceOrderId: 'os-123',
            notes: null,
            createdAt: '2026-04-01T00:00:00.000Z',
            updatedAt: '2026-04-01T00:00:00.000Z',
            client: null,
            serviceOrder: {
              id: 'os-123',
              orderNumber: '123',
              status: 'FINALIZADA',
            },
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      },
    });

    const response = await financialService.list({ page: 1, pageSize: 10 });

    expect(response.data).toEqual([
      expect.objectContaining({
        id: '1',
        amount: 150.5,
        status: 'EM_ABERTO',
        type: 'RECEIVABLE',
      }),
    ]);
  });
});
