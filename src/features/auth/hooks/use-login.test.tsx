import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { vi } from 'vitest';
import { useLogin } from '@/features/auth/hooks/use-login';
import { useGoogleLogin } from '@/features/auth/hooks/use-google-login';
import { authService } from '@/features/auth/services/auth-service';
import { useAuthStore } from '@/store/auth-store';

vi.mock('@/features/auth/services/auth-service', () => ({
  authService: {
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
  },
}));

function createWrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useLogin', () => {
  it('limpa caches antes de gravar nova sessao', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(['clientes'], [{ id: 'client-1' }]);

    vi.mocked(authService.login).mockResolvedValueOnce({
      accessToken: 'token',
      user: {
        id: 'user-1',
        name: 'Ana',
        email: 'ana@oficina.com',
        role: 'ADMIN',
      },
    });

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.login({ email: 'ana@oficina.com', password: '123456' });

    await waitFor(() => {
      expect(queryClient.getQueryData(['clientes'])).toBeUndefined();
      expect(useAuthStore.getState().session?.accessToken).toBe('token');
    });
  });

  it('persiste sessao retornada pelo login com Google', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(['dashboard'], { total: 1 });

    vi.mocked(authService.loginWithGoogle).mockResolvedValueOnce({
      accessToken: 'google-app-token',
      user: {
        id: 'user-2',
        name: 'Bruno',
        email: 'bruno@oficina.com',
        role: 'ADMIN',
      },
    });

    const { result } = renderHook(() => useGoogleLogin(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.loginWithGoogle({ credential: 'google-id-token' });

    await waitFor(() => {
      expect(queryClient.getQueryData(['dashboard'])).toBeUndefined();
      expect(useAuthStore.getState().session?.accessToken).toBe('google-app-token');
    });
  });
});
