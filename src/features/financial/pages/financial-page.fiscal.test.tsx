import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FinancialPage } from '@/features/financial/pages/financial-page';
import { renderWithProviders } from '@/test/render-with-providers';
import { financialService } from '@/features/financial/services/financial-service';

vi.mock('@/features/financial/services/financial-service', () => ({
  financialService: {
    getSummary: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    markAsPaid: vi.fn(),
  },
}));

const openEntry = {
  id: 'financial-open',
  type: 'RECEIVABLE' as const,
  description: 'Recebível em aberto',
  category: 'Serviço',
  amount: 120,
  dueDate: '2026-02-15T12:00:00.000Z',
  paidAt: null,
  paymentMethod: null,
  status: 'EM_ABERTO' as const,
  clientId: null,
  serviceOrderId: null,
  notes: null,
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
  client: null,
  serviceOrder: null,
};

function mockFinancialQueries(entries = [openEntry]) {
  vi.mocked(financialService.list).mockResolvedValue({
    data: entries,
    page: 1,
    pageSize: 10,
    total: entries.length,
    totalPages: 1,
  });
  vi.mocked(financialService.getSummary).mockResolvedValue({
    receivablesValue: 120,
    stockOutValue: 0,
  });
}

describe('FinancialPage', () => {
  it('mantém Financeiro acessível mesmo sem bloqueio fiscal', async () => {
    mockFinancialQueries([]);

    renderWithProviders(<FinancialPage />);

    expect(await screen.findByText('Saldo projetado')).toBeInTheDocument();
    expect(screen.queryByText('Financeiro bloqueado temporariamente')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /cadastrar cnpj/i })).not.toBeInTheDocument();
  });

  it('permite baixar lançamento em aberto com PIX', async () => {
    const user = userEvent.setup();
    mockFinancialQueries();
    vi.mocked(financialService.markAsPaid).mockResolvedValue({
      ...openEntry,
      status: 'PAGO',
      paidAt: '2026-02-15T12:00:00.000Z',
      paymentMethod: 'PIX',
    });

    renderWithProviders(<FinancialPage />);

    await user.click(await screen.findByRole('button', { name: 'Registrar pagamento' }));

    await waitFor(() => {
      expect(financialService.markAsPaid).toHaveBeenCalledWith(
        'financial-open',
        expect.objectContaining({ paymentMethod: 'PIX' }),
      );
    });
  });

  it('cria lançamento em aberto a partir do formulário', async () => {
    const user = userEvent.setup();
    mockFinancialQueries([]);
    vi.mocked(financialService.create).mockResolvedValue(openEntry);

    renderWithProviders(<FinancialPage />);

    await user.click(await screen.findByRole('button', { name: 'Novo lançamento' }));
    await user.type(screen.getByLabelText('Descrição'), 'Recebível de teste');
    await user.type(screen.getByLabelText('Categoria'), 'Serviço');
    await user.type(screen.getByLabelText('Valor'), '125.50');
    fireEvent.change(screen.getByLabelText('Vencimento'), { target: { value: '2026-02-15' } });
    await user.click(screen.getByRole('button', { name: 'Criar lançamento' }));

    await waitFor(() => {
      expect(financialService.create).toHaveBeenCalledTimes(1);
    });
    const [payload] = vi.mocked(financialService.create).mock.calls[0] ?? [];
    expect(payload).toEqual(
      expect.objectContaining({
        type: 'RECEIVABLE',
        description: 'Recebível de teste',
        category: 'Serviço',
        amount: 125.5,
        status: 'EM_ABERTO',
      }),
    );
  });
});
