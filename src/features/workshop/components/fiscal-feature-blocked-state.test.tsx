import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FiscalFeatureBlockedState } from '@/features/workshop/components/fiscal-feature-blocked-state';
import { renderWithProviders } from '@/test/render-with-providers';

describe('FiscalFeatureBlockedState', () => {
  it('exibe bloqueio visual, motivo e CTA para cadastrar CNPJ', () => {
    renderWithProviders(<FiscalFeatureBlockedState featureName="Financeiro" />);

    expect(screen.getByText('Financeiro bloqueado temporariamente')).toBeInTheDocument();
    expect(screen.getByText(/Esta funcionalidade exige o CNPJ da oficina cadastrado/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cadastrar cnpj/i })).toHaveAttribute('href', '/app/oficina');
  });
});
