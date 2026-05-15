import { screen } from '@testing-library/react';
import { vi } from 'vitest';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuthStore } from '@/store/auth-store';
import { renderWithProviders } from '@/test/render-with-providers';

const { meMock } = vi.hoisted(() => ({
  meMock: vi.fn(),
}));

vi.mock('@/features/auth/services/auth-service', () => ({
  authService: {
    me: meMock,
  },
}));

describe('Sidebar', () => {
  it('renderiza menus compatíveis com o perfil financeiro', () => {
    const user = {
      id: '1',
      name: 'Financeiro',
      email: 'financeiro@oficina.com',
      role: 'FINANCEIRO' as const,
    };
    useAuthStore.setState({
      hydrated: true,
      session: {
        accessToken: '',
        user,
      },
    });
    meMock.mockResolvedValue(user);

    renderWithProviders(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Financeiro')).toBeInTheDocument();
    expect(screen.queryByText('Clientes')).not.toBeInTheDocument();
    expect(screen.queryByText('Estoque')).not.toBeInTheDocument();
  });
});
