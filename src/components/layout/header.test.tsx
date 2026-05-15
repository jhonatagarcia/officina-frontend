import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { vi } from 'vitest';
import { Header } from '@/components/layout/header';
import { useAuthStore } from '@/store/auth-store';

const { getProfileMock } = vi.hoisted(() => ({
  getProfileMock: vi.fn(),
}));

vi.mock('@/features/workshop/services/workshop-service', () => ({
  workshopService: {
    getProfile: getProfileMock,
  },
}));

function createWrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('Header', () => {
  beforeEach(() => {
    getProfileMock.mockReset();
  });

  it('limpa cache de queries e remove sessao ao sair', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(['clientes'], [{ id: 'client-1' }]);
    getProfileMock.mockResolvedValue({
      id: 'workshop-1',
      tradeName: 'Oficina Avenida',
      cnpj: null,
      isActive: true,
      fiscalProfile: {
        status: 'INCOMPLETE',
        hasCnpj: false,
        canUseFiscalFeatures: false,
        blockingReason: 'CNPJ ausente',
      },
    });
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

  it('exibe o nome fantasia da oficina quando o perfil esta carregado', () => {
    getProfileMock.mockResolvedValue({
      id: 'workshop-1',
      tradeName: 'Oficina Avenida',
      cnpj: '11222333000181',
      isActive: true,
      fiscalProfile: {
        status: 'COMPLETE',
        hasCnpj: true,
        canUseFiscalFeatures: true,
        blockingReason: null,
      },
    });
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(['workshop', 'profile'], {
      id: 'workshop-1',
      tradeName: 'Oficina Avenida',
      cnpj: '11222333000181',
      isActive: true,
      fiscalProfile: {
        status: 'COMPLETE',
        hasCnpj: true,
        canUseFiscalFeatures: true,
        blockingReason: null,
      },
    });
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

    expect(screen.getByText('Oficina Avenida')).toBeInTheDocument();
  });
});
