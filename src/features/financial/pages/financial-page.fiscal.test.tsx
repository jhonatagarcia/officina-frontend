import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FinancialPage } from '@/features/financial/pages/financial-page';
import { renderWithProviders } from '@/test/render-with-providers';
import { financialService } from '@/features/financial/services/financial-service';

vi.mock('@/features/financial/services/financial-service', () => ({
  financialService: {
    getSummary: vi.fn(),
    list: vi.fn(),
    markAsPaid: vi.fn(),
  },
}));

describe('FinancialPage fiscal gate', () => {
  it('mantem Financeiro acessivel mesmo sem bloqueio fiscal', async () => {
    vi.mocked(financialService.list).mockResolvedValue({
      data: [],
      page: 1,
      pageSize: 10,
      total: 0,
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
});
