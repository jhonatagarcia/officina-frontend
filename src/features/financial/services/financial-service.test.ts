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
            status: 'overdue',
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
        status: 'VENCIDO',
        type: 'RECEIVABLE',
      }),
    ]);
  });

  it('envia chave idempotente quando o pagamento solicita NFSe', async () => {
    vi.mocked(http.patch).mockResolvedValueOnce({
      data: {
        id: 'entry-1',
        type: 'RECEIVABLE',
        amount: '120.00',
        status: 'PAGO',
      },
    });

    await financialService.markAsPaid('entry-1', {
      paymentMethod: 'PIX',
      paidAt: '2026-05-25T12:00:00.000Z',
      requestNfseEmission: true,
    });

    expect(http.patch).toHaveBeenCalledWith(
      '/financial/entry-1/pay',
      expect.objectContaining({ requestNfseEmission: true }),
      { headers: { 'X-Idempotency-Key': 'payment-entry-1-nfse-v1' } },
    );
  });

  it('envia chave idempotente ao gerar NFSe de pagamento ja registrado', async () => {
    vi.mocked(http.post).mockResolvedValueOnce({ data: { status: 'PENDENTE' } });

    await financialService.requestNfseEmission('entry-1');

    expect(http.post).toHaveBeenCalledWith(
      '/financial/entry-1/nfse-emissions',
      undefined,
      { headers: { 'X-Idempotency-Key': 'payment-entry-1-nfse-v1' } },
    );
  });
});
