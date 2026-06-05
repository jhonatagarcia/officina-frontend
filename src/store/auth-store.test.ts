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
});
