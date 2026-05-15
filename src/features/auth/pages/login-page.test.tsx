import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/login-page';
import { renderWithProviders } from '@/test/render-with-providers';

const { loginMock, registerWorkshopMock, forgotPasswordMock, toastErrorMock, toastSuccessMock, loginState } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  registerWorkshopMock: vi.fn(),
  forgotPasswordMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  loginState: { isLoggingIn: false },
}));

vi.mock('@/features/auth/hooks/use-login', () => ({
  useLogin: () => ({
    login: loginMock,
    isLoggingIn: loginState.isLoggingIn,
  }),
}));

vi.mock('@/features/auth/services/auth-service', () => ({
  authService: {
    forgotPassword: forgotPasswordMock,
    registerWorkshop: registerWorkshopMock,
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
    info: vi.fn(),
    success: toastSuccessMock,
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
  beforeEach(() => {
    loginMock.mockReset();
    registerWorkshopMock.mockReset();
    forgotPasswordMock.mockReset();
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
    loginState.isLoggingIn = false;
  });

  it('renderiza login com captcha e envia credenciais válidas', async () => {
    loginMock.mockResolvedValue(undefined);

    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('heading', { name: /entrar na sua conta/i })).toBeInTheDocument();
    expect(screen.getByText(/não sou um robô/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'gestor@oficina.com' } });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'Senha123' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /não sou um robô/i }));
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith({
        email: 'gestor@oficina.com',
        password: 'Senha123',
        captchaToken: 'local-captcha-ok',
      }),
    );
  });

  it('abre e fecha o modal de cadastro a partir de Cadastre-se', () => {
    renderWithProviders(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /cadastre-se/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /cadastrar oficina/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nome fantasia da oficina/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^cnpj$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('permite mostrar e ocultar a senha', () => {
    renderWithProviders(<LoginPage />);

    const passwordInput = screen.getByLabelText(/^senha$/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: /mostrar senha/i }));
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: /ocultar senha/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('valida campos obrigatórios do login', async () => {
    renderWithProviders(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    expect(await screen.findByText(/informe um e-mail válido/i)).toBeInTheDocument();
    expect(screen.getByText(/confirme o captcha/i)).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('mostra loading desabilitado durante login', () => {
    loginState.isLoggingIn = true;

    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled();
  });

  it('usa mensagem generica quando o login falha', async () => {
    loginMock.mockRejectedValueOnce(new Error('stack trace ou detalhe interno'));

    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'gestor@oficina.com' } });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'Senha123' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /não sou um robô/i }));
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith('Não foi possível entrar. Verifique os dados e tente novamente.'));
    expect(toastErrorMock).not.toHaveBeenCalledWith('stack trace ou detalhe interno');
  });

  it('executa fluxo seguro de esqueci senha com captcha', async () => {
    const user = userEvent.setup();
    forgotPasswordMock.mockResolvedValueOnce({});

    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /esqueci minha senha/i }));
    await user.type(screen.getByLabelText(/e-mail/i), 'gestor@oficina.com');
    await user.click(screen.getByRole('checkbox', { name: /não sou um robô/i }));
    await user.click(screen.getByRole('button', { name: /enviar instruções/i }));

    await waitFor(() =>
      expect(forgotPasswordMock.mock.calls[0]?.[0]).toEqual({
        email: 'gestor@oficina.com',
        captchaToken: 'local-captcha-ok',
      }),
    );
    expect(toastSuccessMock).toHaveBeenCalledWith('Se o e-mail estiver cadastrado, enviaremos as instruções de redefinição.');
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
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'Senha123' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /não sou um robô/i }));
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    expect(await screen.findByText('Dashboard seguro')).toBeInTheDocument();
    expect(screen.queryByText('Destino externo')).not.toBeInTheDocument();
  });
});
