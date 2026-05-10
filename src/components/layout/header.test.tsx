import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { Header } from '@/components/layout/header';
import { useAuthStore } from '@/store/auth-store';

function createWrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('Header', () => {
  it('limpa cache de queries e remove sessao ao sair', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(['clientes'], [{ id: 'client-1' }]);
    useAuthStore.getState().setSession({
      accessToken: 'token',
      user: {
        id: 'user-1',
        name: 'Ana',
        email: 'ana@oficina.com',
        role: 'ADMIN',
      },
    });

    render(<Header />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(queryClient.getQueryData(['clientes'])).toEqual([{ id: 'client-1' }]);

    fireEvent.click(screen.getByRole('button', { name: /sair/i }));

    expect(useAuthStore.getState().session).toBeNull();
    expect(queryClient.getQueryData(['clientes'])).toBeUndefined();
  });
});
