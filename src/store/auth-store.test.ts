import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/store/auth-store';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('auth store', () => {
  beforeEach(() => {
    vi.mocked(axios.post).mockReset();
    useAuthStore.setState({ session: null, hydrated: false });
  });

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

  it('reidrata sessao usando refresh token HttpOnly em rotas protegidas', async () => {
    window.history.pushState({}, '', '/inicio/dashboard');
    useAuthStore.setState({ session: null, hydrated: false });
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        accessToken: 'new-token',
        user: {
          id: 'user-1',
          name: 'Ana',
          email: 'ana@oficina.com',
          role: 'ADMIN',
        },
      },
    });

    await expect(useAuthStore.getState().silentRefresh()).resolves.toBe(true);

    expect(useAuthStore.getState().session?.accessToken).toBe('new-token');
    expect(useAuthStore.getState().hydrated).toBe(true);
  });

  it('limpa sessao quando refresh token HttpOnly expira', async () => {
    window.history.pushState({}, '', '/inicio/dashboard');
    vi.mocked(axios.post).mockRejectedValue(new Error('unauthorized'));

    await expect(useAuthStore.getState().silentRefresh()).resolves.toBe(false);

    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().hydrated).toBe(true);
  });

  it('compartilha uma unica rotacao entre requests concorrentes', async () => {
    window.history.pushState({}, '', '/inicio/dashboard');
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        accessToken: 'rotated-token',
        user: {
          id: 'user-1',
          name: 'Ana',
          email: 'ana@oficina.com',
          role: 'ADMIN',
        },
      },
    });

    const [first, second] = await Promise.all([
      useAuthStore.getState().silentRefresh(),
      useAuthStore.getState().silentRefresh(),
    ]);

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().session?.accessToken).toBe('rotated-token');
  });

  it('chama logout na API antes de limpar o estado local', async () => {
    let resolveLogout: (() => void) | undefined;
    vi.mocked(axios.post).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogout = () => resolve({ data: undefined });
        }),
    );
    useAuthStore.getState().setSession({
      accessToken: 'token',
      user: {
        id: 'user-1',
        name: 'Ana',
        email: 'ana@oficina.com',
        role: 'ADMIN',
      },
    });

    const logoutPromise = useAuthStore.getState().logout();

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'),
      {},
      { withCredentials: true },
    );
    expect(useAuthStore.getState().session?.accessToken).toBe('token');

    resolveLogout?.();
    await logoutPromise;

    expect(useAuthStore.getState().session).toBeNull();
  });

  it('limpa o estado local mesmo quando a API de logout falha', async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error('network error'));
    useAuthStore.getState().setSession({
      accessToken: 'token',
      user: {
        id: 'user-1',
        name: 'Ana',
        email: 'ana@oficina.com',
        role: 'ADMIN',
      },
    });

    await expect(useAuthStore.getState().logout()).rejects.toThrow(
      'network error',
    );

    expect(useAuthStore.getState().session).toBeNull();
  });
});
