import { describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => ({
        post: vi.fn(),
      })),
    },
  };
});

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
    const authHttp = vi.mocked(axios.create).mock.results[0]!.value;

    await expect(useAuthStore.getState().silentRefresh()).resolves.toBe(false);

    expect(authHttp.post).not.toHaveBeenCalled();
    expect(useAuthStore.getState().hydrated).toBe(true);
  });
});
