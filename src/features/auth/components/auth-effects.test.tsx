import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, vi } from 'vitest';
import { AuthEffects } from '@/features/auth/components/auth-effects';
import { emitAuthEvent } from '@/features/auth/lib/auth-events';

const { navigateMock, toastErrorMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
  },
}));

function createWrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('AuthEffects', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    toastErrorMock.mockClear();
  });

  it('limpa cache e navega para login quando a sessao expira', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(['clientes'], [{ id: 'client-1' }]);

    render(<AuthEffects />, { wrapper: createWrapper(queryClient) });

    emitAuthEvent({ type: 'SESSION_EXPIRED' });

    await waitFor(() => {
      expect(queryClient.getQueryData(['clientes'])).toBeUndefined();
      expect(toastErrorMock).toHaveBeenCalledWith('Sua sessão expirou. Faça login novamente.');
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('notifica acesso negado sem limpar cache nem navegar', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(['clientes'], [{ id: 'client-1' }]);

    render(<AuthEffects />, { wrapper: createWrapper(queryClient) });

    emitAuthEvent({ type: 'FORBIDDEN' });

    await waitFor(() => {
      expect(queryClient.getQueryData(['clientes'])).toEqual([{ id: 'client-1' }]);
      expect(toastErrorMock).toHaveBeenCalledWith('Você não possui permissão para executar esta ação.');
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });
});
