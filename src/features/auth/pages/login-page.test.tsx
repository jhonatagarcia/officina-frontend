import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/login-page';
import { renderWithProviders } from '@/test/render-with-providers';

const loginMock = vi.fn();
const { toastErrorMock } = vi.hoisted(() => ({
  toastErrorMock: vi.fn(),
}));

vi.mock('@/features/auth/hooks/use-login', () => ({
  useLogin: () => ({
    login: loginMock,
    isLoggingIn: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
    info: vi.fn(),
    success: vi.fn(),
  },
}));

function renderWithCustomRouter(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('LoginPage', () => {
  it('envia credenciais válidas', async () => {
    loginMock.mockResolvedValue(undefined);

    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'gestor@oficina.com' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith({
        email: 'gestor@oficina.com',
        password: '123456',
      }),
    );
  });

  it('usa mensagem generica quando o login falha', async () => {
    loginMock.mockRejectedValueOnce(new Error('stack trace ou detalhe interno'));

    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'gestor@oficina.com' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'senha-invalida' } });
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith('Credenciais inválidas.'));
    expect(toastErrorMock).not.toHaveBeenCalledWith('stack trace ou detalhe interno');
  });

  it('redireciona para dashboard quando o destino salvo nao pertence a /app', async () => {
    loginMock.mockResolvedValueOnce(undefined);

    renderWithCustomRouter(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/login',
            state: {
              from: {
                pathname: '/admin',
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app/dashboard" element={<div>Dashboard seguro</div>} />
          <Route path="/admin" element={<div>Destino externo</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'gestor@oficina.com' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    expect(await screen.findByText('Dashboard seguro')).toBeInTheDocument();
    expect(screen.queryByText('Destino externo')).not.toBeInTheDocument();
  });
});
