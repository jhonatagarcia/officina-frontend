import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/login-page';
import { renderWithProviders } from '@/test/render-with-providers';

const { loginMock, googleLoginMock, registerWorkshopMock, forgotPasswordMock, toastErrorMock, toastSuccessMock, loginState, googleLoginState } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  googleLoginMock: vi.fn(),
  registerWorkshopMock: vi.fn(),
  forgotPasswordMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  loginState: { isLoggingIn: false },
  googleLoginState: { isGoogleLoggingIn: false },
}));

vi.mock('@/features/auth/hooks/use-login', () => ({
  useLogin: () => ({
    login: loginMock,
    isLoggingIn: loginState.isLoggingIn,
  }),
}));

vi.mock('@/features/auth/hooks/use-google-login', () => ({
  useGoogleLogin: () => ({
    loginWithGoogle: googleLoginMock,
    isGoogleLoggingIn: googleLoginState.isGoogleLoggingIn,
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

interface MockGoogleCredentialResponse {
  credential?: string;
}

interface MockGoogleIdentity {
  initialize: ReturnType<typeof vi.fn>;
  renderButton: ReturnType<typeof vi.fn>;
  callback?: (response: MockGoogleCredentialResponse) => void;
}

function installGoogleIdentityMock(options: { credential?: string } = {}) {
  const googleIdentity: MockGoogleIdentity = {
    initialize: vi.fn((config: { callback: (response: MockGoogleCredentialResponse) => void }) => {
      googleIdentity.callback = config.callback;
    }),
    renderButton: vi.fn((parent: HTMLElement) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Entrar com Google';
      button.addEventListener('click', () => {
        googleIdentity.callback?.({ credential: options.credential ?? 'google-id-token' });
      });
      parent.appendChild(button);
    }),
  };

  Object.defineProperty(window, 'google', {
    configurable: true,
    value: {
      accounts: {
        id: googleIdentity,
      },
    },
  });

  return googleIdentity;
}

describe('LoginPage', () => {
  beforeEach(() => {
    loginMock.mockReset();
    googleLoginMock.mockReset();
    registerWorkshopMock.mockReset();
    forgotPasswordMock.mockReset();
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
    loginState.isLoggingIn = false;
    googleLoginState.isGoogleLoggingIn = false;
    installGoogleIdentityMock();
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

  it('renderiza botao de login com Google via Google Identity Services', async () => {
    const googleIdentity = installGoogleIdentityMock();
    renderWithProviders(<LoginPage />);

    expect(await screen.findByRole('button', { name: /entrar com google/i })).toBeInTheDocument();
    expect(googleIdentity.initialize).toHaveBeenCalledWith(expect.objectContaining({
      client_id: 'google-client-id.test.apps.googleusercontent.com',
    }));
    expect(googleIdentity.renderButton).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({
      logo_alignment: 'left',
      text: 'signin_with',
      theme: 'outline',
    }));
  });

  it('envia credential do Google ao backend e conclui login', async () => {
    const user = userEvent.setup();
    googleLoginMock.mockResolvedValueOnce({
      accessToken: 'app-token',
      user: {
        id: 'user-1',
        name: 'Ana',
        email: 'ana@oficina.com',
        role: 'ADMIN',
        workshopFiscalStatus: 'COMPLETE',
      },
    });

    renderWithCustomRouter(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app/dashboard" element={<div>Dashboard seguro</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /entrar com google/i }));

    await waitFor(() => expect(googleLoginMock).toHaveBeenCalledWith({ credential: 'google-id-token' }));
    expect(toastSuccessMock).toHaveBeenCalledWith('Acesso com Google realizado com sucesso.');
    expect(await screen.findByText('Dashboard seguro')).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('mostra loading durante validacao do Google', async () => {
    googleLoginState.isGoogleLoggingIn = true;

    renderWithProviders(<LoginPage />);

    expect(await screen.findByText(/validando acesso com google/i)).toBeInTheDocument();
  });

  it('trata erro do Google sem enviar payload vazio ao backend', async () => {
    const user = userEvent.setup();
    installGoogleIdentityMock({ credential: '' });

    renderWithProviders(<LoginPage />);

    await user.click(await screen.findByRole('button', { name: /entrar com google/i }));

    expect(googleLoginMock).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledWith('Não foi possível iniciar o login com Google. Tente novamente ou use e-mail e senha.');
  });

  it('trata erro do backend ao validar Google com mensagem segura', async () => {
    const user = userEvent.setup();
    googleLoginMock.mockRejectedValueOnce({ message: 'stack trace interno' });

    renderWithProviders(<LoginPage />);

    await user.click(await screen.findByRole('button', { name: /entrar com google/i }));

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith('Não foi possível entrar com Google. Tente novamente ou use e-mail e senha.'));
    expect(toastErrorMock).not.toHaveBeenCalledWith('stack trace interno');
  });

  it('trata conflito de vinculo Google com orientacao clara', async () => {
    const user = userEvent.setup();
    googleLoginMock.mockRejectedValueOnce({ statusCode: 409, message: 'provider conflict internal detail' });

    renderWithProviders(<LoginPage />);

    await user.click(await screen.findByRole('button', { name: /entrar com google/i }));

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith('Esta conta Google não pôde ser vinculada automaticamente. Entre com e-mail e senha.'));
    expect(toastErrorMock).not.toHaveBeenCalledWith('provider conflict internal detail');
  });

  it('orienta completar dados da oficina quando login Google retorna onboarding pendente', async () => {
    const user = userEvent.setup();
    googleLoginMock.mockResolvedValueOnce({
      accessToken: 'app-token',
      user: {
        id: 'user-1',
        name: 'Ana',
        email: 'ana@oficina.com',
        role: 'ADMIN',
        workshopFiscalStatus: 'INCOMPLETE',
      },
    });

    renderWithCustomRouter(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app/oficina" element={<div>Cadastro da oficina</div>} />
          <Route path="/app/dashboard" element={<div>Dashboard seguro</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /entrar com google/i }));

    await waitFor(() =>
      expect(toastSuccessMock).toHaveBeenCalledWith('Acesso com Google realizado. Complete os dados da oficina para liberar todos os recursos.'),
    );
    expect(await screen.findByText('Cadastro da oficina')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard seguro')).not.toBeInTheDocument();
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

  it('envia confirmacao de senha no cadastro de oficina', async () => {
    const user = userEvent.setup();
    registerWorkshopMock.mockResolvedValueOnce({ message: 'ok' });

    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /cadastre-se/i }));

    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/nome fantasia da oficina/i), 'Oficina Avenida');
    await user.type(within(dialog).getByLabelText(/^e-mail$/i), 'admin@oficina.com');
    await user.type(within(dialog).getByLabelText(/^senha$/i), 'Senha123');
    await user.type(within(dialog).getByLabelText(/confirmar senha/i), 'Senha123');
    await user.click(within(dialog).getByRole('checkbox', { name: /não sou um robô/i }));
    await user.click(within(dialog).getByRole('button', { name: /criar cadastro/i }));

    await waitFor(() =>
      expect(registerWorkshopMock.mock.calls[0]?.[0]).toEqual({
        tradeName: 'Oficina Avenida',
        cnpj: null,
        email: 'admin@oficina.com',
        password: 'Senha123',
        confirmPassword: 'Senha123',
        captchaToken: 'local-captcha-ok',
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(toastSuccessMock).toHaveBeenCalledWith('Cadastro realizado com sucesso.');
    expect(screen.getByLabelText(/e-mail/i)).toHaveValue('admin@oficina.com');
    expect(screen.getByLabelText(/^senha$/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: /^entrar$/i })).toBeInTheDocument();
  });

  it('mantem modal aberto e mostra mensagem quando cadastro falha', async () => {
    const user = userEvent.setup();
    registerWorkshopMock.mockRejectedValueOnce({ message: 'E-mail já cadastrado' });

    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /cadastre-se/i }));

    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/nome fantasia da oficina/i), 'Oficina Avenida');
    await user.type(within(dialog).getByLabelText(/^e-mail$/i), 'admin@oficina.com');
    await user.type(within(dialog).getByLabelText(/^senha$/i), 'Senha123');
    await user.type(within(dialog).getByLabelText(/confirmar senha/i), 'Senha123');
    await user.click(within(dialog).getByRole('checkbox', { name: /não sou um robô/i }));
    await user.click(within(dialog).getByRole('button', { name: /criar cadastro/i }));

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith('E-mail já cadastrado'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
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

  it('mostra loading durante envio de recuperacao de senha', async () => {
    const user = userEvent.setup();
    let resolveForgot: (value: unknown) => void = () => undefined;
    forgotPasswordMock.mockReturnValueOnce(new Promise((resolve) => {
      resolveForgot = resolve;
    }));

    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /esqueci minha senha/i }));
    await user.type(screen.getByLabelText(/e-mail/i), 'gestor@oficina.com');
    await user.click(screen.getByRole('checkbox', { name: /não sou um robô/i }));
    await user.click(screen.getByRole('button', { name: /enviar instruções/i }));

    expect(await screen.findByRole('button', { name: /enviando/i })).toBeDisabled();

    resolveForgot({});
    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledWith('Se o e-mail estiver cadastrado, enviaremos as instruções de redefinição.'));
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
