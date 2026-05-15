import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FinancialPage } from '@/features/financial/pages/financial-page';
import { renderWithProviders } from '@/test/render-with-providers';
import { useAuthStore } from '@/store/auth-store';
import type { User } from '@/types/auth';

const { meMock } = vi.hoisted(() => ({
  meMock: vi.fn(),
}));

vi.mock('@/features/auth/services/auth-service', () => ({
  authService: {
    me: meMock,
  },
}));

function setSessionUser(user: User) {
  useAuthStore.setState({
    hydrated: true,
    session: {
      accessToken: '',
      user,
    },
  });
}

describe('FinancialPage fiscal gate', () => {
  it('bloqueia visualmente funcionalidade fiscal quando falta CNPJ', () => {
    const user: User = {
      id: 'user-1',
      name: 'Ana',
      email: 'ana@oficina.com',
      role: 'ADMIN',
      workshop: { id: 'workshop-1', cnpj: null },
    };
    setSessionUser(user);
    meMock.mockResolvedValue(user);

    renderWithProviders(<FinancialPage />);

    expect(screen.getByText('Financeiro bloqueado temporariamente')).toBeInTheDocument();
    expect(screen.getByText(/Cadastre o CNPJ para continuar usando recursos fiscais/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cadastrar cnpj/i })).toHaveAttribute('href', '/app/oficina');
  });
});
