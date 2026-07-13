import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/login-page';
import { renderWithProviders } from '@/test/render-with-providers';
import { useAuthStore } from '@/store/auth-store';

const { loginMock, googleLoginMock, registerWorkshopMock, forgotPasswordMock, executeRecaptchaMock, toastErrorMock, toastSuccessMock, loginState, googleLoginState } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  googleLoginMock: vi.fn(),
  registerWorkshopMock: vi.fn(),
  forgotPasswordMock: vi.fn(),
  executeRecaptchaMock: vi.fn(),
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

vi.mock('@/features/auth/hooks/use-recaptcha', () => ({
  useRecaptcha: () => executeRecaptchaMock,
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
    executeRecaptchaMock.mockReset();
    executeRecaptchaMock.mockResolvedValue('recaptcha-token');
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
    loginState.isLoggingIn = false;
    googleLoginState.isGoogleLoggingIn = false;
    useAuthStore.getState().setSession(null);
    installGoogleIdentityMock();
  });

  it('gera token reCAPTCHA e envia credenciais válidas', async () => {
    loginMock.mockResolvedValue(undefined);

    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('heading', { name: /entrar na sua conta/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'gestor@oficina.com' } });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'Senha123' } });
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith({
        email: 'gestor@oficina.com',
        password: 'Senha123',
        captchaToken: 'recaptcha-token',
      }),
    );
    expect(executeRecaptchaMock).toHaveBeenCalledWith('login');
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
          <Route path="/inicio/dashboard" element={<div>Dashboard seguro</div>} />
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
          <Route path="/inicio/oficina" element={<div>Cadastro da oficina</div>} />
          <Route path="/inicio/dashboard" element={<div>Dashboard seguro</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /entrar com google/i }));

    await waitFor(() =>
      expect(toastSuccessMock).toHaveBeenCalledWith('Acesso com Google realizado. Complete os dados do negócio para liberar todos os recursos.'),
    );
    expect(await screen.findByText('Cadastro da oficina')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard seguro')).not.toBeInTheDocument();
  });

  it('abre o modal de cadastro pelo link Cadastre-se', async () => {
    renderWithProviders(<LoginPage />);

    const registerButton = await screen.findByRole('button', { name: /cadastre-se/i });
    fireEvent.click(registerButton);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /cadastrar negócio/i })).toBeInTheDocument();
  });

  it('faz login automaticamente apos cadastro realizado com sucesso', async () => {
    const user = userEvent.setup();
    registerWorkshopMock.mockResolvedValueOnce({
      accessToken: 'signup-token',
      user: {
        id: 'user-1',
        name: 'Auto teste localhost',
        email: 'autoteste@local.com.br',
        role: 'ADMIN',
        workshopFiscalStatus: 'COMPLETE',
        workshop: {
          id: 'workshop-1',
          tradeName: 'Auto teste localhost',
          cnpj: '11222333000181',
        },
      },
    });

    renderWithCustomRouter(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/inicio/dashboard" element={<div>Dashboard seguro</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /cadastre-se/i }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/nome fantasia do negócio/i), 'Auto teste localhost');
    await user.type(within(dialog).getByLabelText(/^cnpj$/i), '11222333000181');
    await user.type(within(dialog).getByLabelText(/^e-mail$/i), 'autoteste@local.com.br');
    await user.type(within(dialog).getByLabelText(/^senha$/i), 'Senha123');
    await user.type(within(dialog).getByLabelText(/confirmar senha/i), 'Senha123');
    await user.click(within(dialog).getByRole('checkbox', { name: /não sou um robô/i }));
    await user.click(within(dialog).getByRole('button', { name: /criar cadastro/i }));

    await waitFor(() => expect(registerWorkshopMock).toHaveBeenCalled());
    expect(registerWorkshopMock.mock.calls[0]?.[0]).toEqual({
      tradeName: 'Auto teste localhost',
      cnpj: '11222333000181',
      email: 'autoteste@local.com.br',
      password: 'Senha123',
      confirmPassword: 'Senha123',
      captchaToken: 'local-captcha-ok',
    });
    expect(useAuthStore.getState().session?.accessToken).toBe('signup-token');
    expect(await screen.findByText('Dashboard seguro')).toBeInTheDocument();
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
    expect(executeRecaptchaMock).not.toHaveBeenCalled();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('mostra loading desabilitado durante login', () => {
    loginState.isLoggingIn = true;

    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled();
  });

  it('mostra erro em tela quando o usuario nao foi cadastrado', async () => {
    loginMock.mockRejectedValueOnce(new Error('stack trace ou detalhe interno'));

    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'gestor@oficina.com' } });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'Senha123' } });
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário não cadastrado ou senha inválida.');
    expect(toastErrorMock).toHaveBeenCalledWith('Usuário não cadastrado ou senha inválida.');
    expect(toastErrorMock).not.toHaveBeenCalledWith('stack trace ou detalhe interno');
  });

  it('habilita recuperacao de senha pelo login', () => {
    renderWithProviders(<LoginPage />);

    const forgotButton = screen.getByRole('button', { name: /esqueci minha senha/i });
    expect(forgotButton).toBeEnabled();
    fireEvent.click(forgotButton);

    expect(screen.getByRole('heading', { name: /recuperar senha/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar instruções/i })).toBeInTheDocument();
    expect(forgotPasswordMock).not.toHaveBeenCalled();
  });

  it('redireciona para dashboard quando o destino salvo nao pertence a /inicio', async () => {
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
          <Route path="/inicio/dashboard" element={<div>Dashboard seguro</div>} />
          <Route path="/admin" element={<div>Destino externo</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'gestor@oficina.com' } });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'Senha123' } });
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    expect(await screen.findByText('Dashboard seguro')).toBeInTheDocument();
    expect(screen.queryByText('Destino externo')).not.toBeInTheDocument();
  });
});
