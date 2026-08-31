import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FiscalFeatureBlockedState } from '@/features/workshop/components/fiscal-feature-blocked-state';
import { renderWithProviders } from '@/test/render-with-providers';

describe('FiscalFeatureBlockedState', () => {
  it('informa que financeiro nao depende de CNPJ e nao simula emissao fiscal', () => {
    renderWithProviders(<FiscalFeatureBlockedState featureName="Financeiro" />);

    expect(
      screen.getByText('Financeiro disponível sem CNPJ'),
    ).toBeInTheDocument();
    expect(screen.getByText(/CNPJ é opcional/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Emissão fiscal não está disponível/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /cadastrar cnpj/i }),
    ).not.toBeInTheDocument();
  });
});
