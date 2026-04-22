import { screen } from '@testing-library/react';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuthStore } from '@/store/auth-store';
import { renderWithProviders } from '@/test/render-with-providers';

describe('Sidebar', () => {
  it('renderiza menus compatíveis com o perfil financeiro', () => {
    useAuthStore.setState({
      hydrated: true,
      session: {
        accessToken: 'token',
        user: {
          id: '1',
          name: 'Financeiro',
          email: 'financeiro@oficina.com',
          role: 'FINANCEIRO',
        },
      },
    });

    renderWithProviders(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Financeiro')).toBeInTheDocument();
    expect(screen.queryByText('Clientes')).not.toBeInTheDocument();
    expect(screen.queryByText('Estoque')).not.toBeInTheDocument();
  });
});
