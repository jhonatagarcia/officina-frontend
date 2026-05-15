import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import type { PropsWithChildren } from 'react';
import { ResetPasswordPage } from '@/features/auth/pages/reset-password-page';

const { resetPasswordMock, toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  resetPasswordMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock('@/features/auth/services/auth-service', () => ({
  authService: {
    resetPassword: resetPasswordMock,
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

function TestProviders({ children }: PropsWithChildren) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function renderResetPage(path = '/reset-password?token=token-123') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>,
    { wrapper: TestProviders },
  );
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    resetPasswordMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  it('renderiza estado de token invalido quando nao ha token na URL', () => {
    renderResetPage('/reset-password');

    expect(screen.getByText(/link de redefinição está inválido ou expirado/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voltar ao login/i })).toHaveAttribute('href', '/login');
  });

  it('redefine senha com token da URL e valida confirmacao', async () => {
    resetPasswordMock.mockResolvedValueOnce({});

    renderResetPage();

    fireEvent.change(screen.getByLabelText(/^nova senha$/i), { target: { value: 'Senha123' } });
    fireEvent.change(screen.getByLabelText(/confirmar nova senha/i), { target: { value: 'Senha123' } });
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() =>
      expect(resetPasswordMock.mock.calls[0]?.[0]).toEqual({
        token: 'token-123',
        password: 'Senha123',
      }),
    );
    expect(await screen.findByText('Login')).toBeInTheDocument();
    expect(toastSuccessMock).toHaveBeenCalledWith('Senha redefinida com sucesso. Entre com sua nova senha.');
  });
});
