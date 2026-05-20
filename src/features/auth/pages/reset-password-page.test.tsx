import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import type { PropsWithChildren } from 'react';
import { ResetPasswordPage } from '@/features/auth/pages/reset-password-page';

const validToken = 'reset-token-12345678901234567890123456789012';

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

function renderResetPage(path = `/reset-password?token=${validToken}`) {
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

    expect(screen.getByText(/link de redefinição está inválido/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voltar ao login/i })).toHaveAttribute('href', '/login');
  });

  it('renderiza formulario de redefinicao quando ha token', () => {
    renderResetPage();

    expect(screen.getByRole('heading', { name: /redefinir senha/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^nova senha$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar nova senha/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /não sou um robô/i })).toBeInTheDocument();
  });

  it('valida senha forte antes de enviar redefinicao', async () => {
    renderResetPage();

    fireEvent.change(screen.getByLabelText(/^nova senha$/i), { target: { value: 'fraca' } });
    fireEvent.change(screen.getByLabelText(/confirmar nova senha/i), { target: { value: 'fraca' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /não sou um robô/i }));
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    expect(await screen.findByText(/a senha precisa ter ao menos 8 caracteres/i)).toBeInTheDocument();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it('valida confirmacao de senha antes de enviar redefinicao', async () => {
    renderResetPage();

    fireEvent.change(screen.getByLabelText(/^nova senha$/i), { target: { value: 'Senha123' } });
    fireEvent.change(screen.getByLabelText(/confirmar nova senha/i), { target: { value: 'Outra123' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /não sou um robô/i }));
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    expect(await screen.findByText(/as senhas precisam ser iguais/i)).toBeInTheDocument();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it('redefine senha com token da URL, confirmacao e captcha', async () => {
    resetPasswordMock.mockResolvedValueOnce({});

    renderResetPage();

    fireEvent.change(screen.getByLabelText(/^nova senha$/i), { target: { value: 'Senha123' } });
    fireEvent.change(screen.getByLabelText(/confirmar nova senha/i), { target: { value: 'Senha123' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /não sou um robô/i }));
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() =>
      expect(resetPasswordMock.mock.calls[0]?.[0]).toEqual({
        token: validToken,
        password: 'Senha123',
        passwordConfirmation: 'Senha123',
        captchaToken: 'local-captcha-ok',
      }),
    );
    expect(await screen.findByText('Login')).toBeInTheDocument();
    expect(toastSuccessMock).toHaveBeenCalledWith('Senha redefinida com sucesso. Entre com sua nova senha.');
  });

  it('trata token invalido retornado pelo backend', async () => {
    resetPasswordMock.mockRejectedValueOnce({ statusCode: 400, message: 'Token invalido ou expirado' });

    renderResetPage();

    fireEvent.change(screen.getByLabelText(/^nova senha$/i), { target: { value: 'Senha123' } });
    fireEvent.change(screen.getByLabelText(/confirmar nova senha/i), { target: { value: 'Senha123' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /não sou um robô/i }));
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    expect(await screen.findByText(/este link expirou ou já foi usado/i)).toBeInTheDocument();
    expect(toastErrorMock).toHaveBeenCalledWith('Este link expirou ou já foi usado. Solicite uma nova redefinição.');
    expect(screen.getByRole('link', { name: /voltar ao login/i })).toHaveAttribute('href', '/login');
  });

  it('trata token expirado ou ja usado sem expor detalhe tecnico', async () => {
    resetPasswordMock.mockRejectedValueOnce({ statusCode: 400, message: 'reset token already used' });

    renderResetPage();

    fireEvent.change(screen.getByLabelText(/^nova senha$/i), { target: { value: 'Senha123' } });
    fireEvent.change(screen.getByLabelText(/confirmar nova senha/i), { target: { value: 'Senha123' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /não sou um robô/i }));
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    expect(await screen.findByText(/este link expirou ou já foi usado/i)).toBeInTheDocument();
    expect(toastErrorMock).not.toHaveBeenCalledWith('reset token already used');
  });
});
