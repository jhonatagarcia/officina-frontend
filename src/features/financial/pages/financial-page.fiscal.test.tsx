import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FinancialPage } from '@/features/financial/pages/financial-page';
import { renderWithProviders } from '@/test/render-with-providers';
import { financialService } from '@/features/financial/services/financial-service';

vi.mock('@/features/financial/services/financial-service', () => ({
  financialService: {
    getSummary: vi.fn(),
    list: vi.fn(),
    markAsPaid: vi.fn(),
    requestNfseEmission: vi.fn(),
    getDanfseDownload: vi.fn(),
  },
}));

describe('FinancialPage fiscal gate', () => {
  it('mantem Financeiro acessivel mesmo sem bloqueio fiscal', async () => {
    vi.mocked(financialService.list).mockResolvedValue({
      data: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    });
    vi.mocked(financialService.getSummary).mockResolvedValue({
      receivablesValue: 0,
      stockOutValue: 0,
    });

    renderWithProviders(<FinancialPage />);

    expect(await screen.findByText('Saldo projetado')).toBeInTheDocument();
    expect(screen.queryByText('Financeiro bloqueado temporariamente')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /cadastrar cnpj/i })).not.toBeInTheDocument();
  });

  it('abre modal de pagamento com opcao de NFSe para recebimento de OS', async () => {
    vi.mocked(financialService.list).mockResolvedValue({
      data: [
        {
          id: 'entry-1',
          type: 'RECEIVABLE',
          description: 'Cobranca OS',
          category: 'Ordem de Servico',
          amount: 120,
          dueDate: '2026-05-25T00:00:00.000Z',
          paidAt: null,
          paymentMethod: null,
          status: 'PENDENTE',
          clientId: 'client-1',
          serviceOrderId: 'order-1',
          notes: null,
          createdAt: '2026-05-25T00:00:00.000Z',
          updatedAt: '2026-05-25T00:00:00.000Z',
          client: { id: 'client-1', name: 'Cliente', document: null },
          serviceOrder: { id: 'order-1', orderNumber: '1', status: 'ENTREGUE' },
          fiscalEmission: null,
        },
      ],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    });
    vi.mocked(financialService.getSummary).mockResolvedValue({
      receivablesValue: 120,
      stockOutValue: 0,
    });

    renderWithProviders(<FinancialPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Registrar pagamento' }));

    expect(screen.getByRole('heading', { name: 'Registrar pagamento' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Solicitar emissao da NFSe/)).toBeEnabled();
  });

  it('nao oferece nova NFSe quando pagamento ja possui emissao', async () => {
    vi.mocked(financialService.list).mockResolvedValue({
      data: [
        {
          id: 'entry-paid',
          type: 'RECEIVABLE',
          description: 'Cobranca OS',
          category: 'Ordem de Servico',
          amount: 120,
          dueDate: '2026-05-25T00:00:00.000Z',
          paidAt: '2026-05-25T12:00:00.000Z',
          paymentMethod: 'PIX',
          status: 'PAGO',
          clientId: 'client-1',
          serviceOrderId: 'order-1',
          notes: null,
          createdAt: '2026-05-25T00:00:00.000Z',
          updatedAt: '2026-05-25T00:00:00.000Z',
          client: { id: 'client-1', name: 'Cliente', document: null },
          serviceOrder: { id: 'order-1', orderNumber: '1', status: 'ENTREGUE' },
          fiscalEmission: {
            id: 'emission-1',
            financialEntryId: 'entry-paid',
            serviceOrderId: 'order-1',
            status: 'PENDENTE',
            serviceAmount: '120',
            invoiceNumber: null,
            danfseAvailable: false,
            rejectionReason: null,
            createdAt: '2026-05-25T12:00:00.000Z',
            updatedAt: '2026-05-25T12:00:00.000Z',
          },
        },
      ],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    });
    vi.mocked(financialService.getSummary).mockResolvedValue({
      receivablesValue: 120,
      stockOutValue: 0,
    });

    renderWithProviders(<FinancialPage />);

    expect((await screen.findAllByText('Pendente')).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Gerar NFSe' })).not.toBeInTheDocument();
  });
});
