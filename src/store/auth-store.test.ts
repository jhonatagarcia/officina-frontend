import { describe, expect, it } from 'vitest';
import { useAuthStore } from '@/store/auth-store';

describe('auth store', () => {
  it('normaliza a sessao persistida mantendo apenas dados necessarios do usuario', () => {
    useAuthStore.getState().setSession({
      accessToken: 'token',
      user: {
        id: 'user-1',
        name: 'Ana',
        email: 'ana@oficina.com',
        role: 'ADMIN',
        isActive: true,
        lastLoginAt: '2026-05-08T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-05-08T00:00:00.000Z',
      },
    });

    expect(useAuthStore.getState().session).toEqual({
      accessToken: 'token',
      user: {
        id: 'user-1',
        name: 'Ana',
        email: 'ana@oficina.com',
        role: 'ADMIN',
      },
    });
  });

  it('descarta sessao invalida', () => {
    useAuthStore.getState().setSession({
      accessToken: '',
      user: {
        id: 'user-1',
        name: 'Ana',
        email: 'ana@oficina.com',
        role: 'ADMIN',
      },
    });

    expect(useAuthStore.getState().session).toBeNull();
  });

  it('nao chama refresh tenant em rotas admin', async () => {
    window.history.pushState({}, '', '/admin/login');

    await expect(useAuthStore.getState().silentRefresh()).resolves.toBe(false);

    expect(useAuthStore.getState().hydrated).toBe(true);
  });

  it('hidrata sem chamar endpoint de refresh quando backend nao tem refresh token', async () => {
    window.history.pushState({}, '', '/app/dashboard');
    useAuthStore.setState({ session: null, hydrated: false });

    await expect(useAuthStore.getState().silentRefresh()).resolves.toBe(false);

    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().hydrated).toBe(true);
  });
});
