import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute, RoleGuard } from '@/routes/route-guards';
import { useAuthStore } from '@/store/auth-store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function renderWithQuery(ui: React.ReactElement, initialEntries = ['/']) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('route guards', () => {
  it('redireciona usuário sem sessão para login', () => {
    useAuthStore.setState({ session: null, hydrated: true });

    renderWithQuery(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/app/dashboard" element={<div>Dashboard</div>} />
        </Route>
        <Route path="/login" element={<div>Tela de login</div>} />
      </Routes>,
      ['/app/dashboard'],
    );

    expect(screen.getByText('Tela de login')).toBeInTheDocument();
  });

  it('bloqueia acesso quando o perfil não possui permissão', () => {
    useAuthStore.setState({
      hydrated: true,
      session: {
        accessToken: 'token',
        user: {
          id: '1',
          name: 'Mecânico',
          email: 'mecanico@oficina.com',
          role: 'MECANICO',
        },
      },
    });

    renderWithQuery(
      <Routes>
        <Route element={<RoleGuard roles={['ADMIN', 'FINANCEIRO']} />}>
          <Route path="/financeiro" element={<div>Financeiro</div>} />
        </Route>
      </Routes>,
      ['/financeiro'],
    );

    expect(screen.getByText(/acesso não autorizado/i)).toBeInTheDocument();
  });

  it('renderiza rota de visitante enquanto a sessao ainda hidrata', () => {
    useAuthStore.setState({
      session: {
        accessToken: 'token',
        user: {
          id: '1',
          name: 'Atendente',
          email: 'atendente@oficina.com',
          role: 'ATENDENTE',
        },
      },
      hydrated: false,
    });

    renderWithQuery(
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<div>Tela de login</div>} />
        </Route>
      </Routes>,
      ['/login'],
    );

    expect(screen.getByText('Tela de login')).toBeInTheDocument();
  });
});
