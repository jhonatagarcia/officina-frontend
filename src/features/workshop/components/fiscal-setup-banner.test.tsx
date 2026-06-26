import { act, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FiscalSetupBanner } from '@/features/workshop/components/fiscal-setup-banner';
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

describe('FiscalSetupBanner', () => {
  it('exibe aviso quando a oficina nao tem CNPJ', () => {
    const user: User = {
      id: 'user-1',
      name: 'Ana',
      email: 'ana@oficina.com',
      role: 'ADMIN',
      workshop: { id: 'workshop-1', name: 'Oficina Pro', cnpj: null },
    };
    setSessionUser(user);
    meMock.mockResolvedValue(user);

    renderWithProviders(<FiscalSetupBanner />);

    expect(screen.getByText('Cadastro fiscal incompleto')).toBeInTheDocument();
    expect(screen.getByText(/Complete o CNPJ da oficina/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cadastrar cnpj/i })).toHaveAttribute('href', '/inicio/oficina');
  });

  it('nao exibe aviso quando a oficina tem CNPJ', () => {
    const user: User = {
      id: 'user-1',
      name: 'Ana',
      email: 'ana@oficina.com',
      role: 'ADMIN',
      workshop: { id: 'workshop-1', name: 'Oficina Pro', cnpj: '11222333000181' },
    };
    setSessionUser(user);
    meMock.mockResolvedValue(user);

    renderWithProviders(<FiscalSetupBanner />);

    expect(screen.queryByText('Cadastro fiscal incompleto')).not.toBeInTheDocument();
  });

  it('remove o aviso quando o estado recebido muda para completo', () => {
    const incompleteUser: User = {
      id: 'user-1',
      name: 'Ana',
      email: 'ana@oficina.com',
      role: 'ADMIN',
      workshop: { id: 'workshop-1', name: 'Oficina Pro', cnpj: null },
    };
    const completeUser: User = {
      ...incompleteUser,
      workshop: { id: 'workshop-1', name: 'Oficina Pro', cnpj: '11222333000181' },
    };
    setSessionUser(incompleteUser);
    meMock.mockResolvedValue(incompleteUser);

    const { rerender } = renderWithProviders(<FiscalSetupBanner />);
    expect(screen.getByText('Cadastro fiscal incompleto')).toBeInTheDocument();

    act(() => {
      setSessionUser(completeUser);
      meMock.mockResolvedValue(completeUser);
      rerender(<FiscalSetupBanner />);
    });

    expect(screen.queryByText('Cadastro fiscal incompleto')).not.toBeInTheDocument();
  });

  it('nao bloqueia nem avisa quando o backend ainda nao envia o contrato fiscal', () => {
    const user: User = {
      id: 'user-1',
      name: 'Ana',
      email: 'ana@oficina.com',
      role: 'ADMIN',
    };
    setSessionUser(user);
    meMock.mockResolvedValue(user);

    renderWithProviders(<FiscalSetupBanner />);

    expect(screen.queryByText('Cadastro fiscal incompleto')).not.toBeInTheDocument();
  });
});
