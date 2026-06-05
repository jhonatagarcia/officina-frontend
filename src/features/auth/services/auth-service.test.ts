import { describe, expect, it, vi } from 'vitest';
import { authService } from '@/features/auth/services/auth-service';
import { http } from '@/services/api/http';

vi.mock('@/services/api/http', () => ({
  http: {
    post: vi.fn(),
  },
}));

describe('authService', () => {
  it('envia credential do Google no endpoint de login social', async () => {
    vi.mocked(http.post).mockResolvedValueOnce({
      data: {
        accessToken: 'app-token',
        user: {
          id: 'user-1',
          name: 'Ana',
          email: 'ana@oficina.com',
          role: 'ADMIN',
        },
      },
    });

    await authService.loginWithGoogle({ credential: 'google-id-token' });

    expect(http.post).toHaveBeenCalledWith('/auth/google', {
      credential: 'google-id-token',
    });
  });

  it('solicita recuperacao de senha no endpoint esperado pelo backend', async () => {
    vi.mocked(http.post).mockResolvedValueOnce({ data: { message: 'ok' } });

    await authService.forgotPassword({
      email: 'gestor@oficina.com',
      captchaToken: 'captcha-token',
    });

    expect(http.post).toHaveBeenCalledWith('/auth/forgot-password', {
      email: 'gestor@oficina.com',
      captchaToken: 'captcha-token',
    });
  });

  it('redefine senha no endpoint esperado pelo backend', async () => {
    vi.mocked(http.post).mockResolvedValueOnce({ data: { message: 'ok' } });

    await authService.resetPassword({
      token: 'reset-token',
      password: 'Senha123',
      passwordConfirmation: 'Senha123',
      captchaToken: 'captcha-token',
    });

    expect(http.post).toHaveBeenCalledWith('/auth/reset-password', {
      token: 'reset-token',
      password: 'Senha123',
      passwordConfirmation: 'Senha123',
      captchaToken: 'captcha-token',
    });
  });
});
