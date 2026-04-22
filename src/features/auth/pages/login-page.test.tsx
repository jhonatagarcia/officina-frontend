import { fireEvent, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { LoginPage } from '@/features/auth/pages/login-page';
import { renderWithProviders } from '@/test/render-with-providers';

const loginMock = vi.fn();

vi.mock('@/features/auth/hooks/use-login', () => ({
  useLogin: () => ({
    login: loginMock,
    isLoggingIn: false,
  }),
}));

describe('LoginPage', () => {
  it('envia credenciais válidas', async () => {
    loginMock.mockResolvedValue(undefined);

    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'gestor@oficina.com' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith({
        email: 'gestor@oficina.com',
        password: '123456',
      }),
    );
  });
});
