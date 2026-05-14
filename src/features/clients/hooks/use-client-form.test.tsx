import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { vi } from 'vitest';
import { DEFAULT_TABLE_PAGE_SIZE } from '@/constants/pagination';
import { useClientForm } from '@/features/clients/hooks/use-client-form';
import type { ClientSchema } from '@/features/clients/schemas/client-schema';
import { clientsService } from '@/features/clients/services/clients-service';
import type { Client } from '@/features/clients/types';
import type { PaginatedResponse } from '@/types/common';

const { toastSuccessMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
}));

vi.mock('@/features/clients/services/clients-service', () => ({
  clientsService: {
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: toastSuccessMock,
  },
}));

function createWrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const currentClient: Client = {
  id: 'client-1',
  name: 'Cliente Antigo',
  document: '12345678901',
  phone: '11987654321',
  email: 'antigo@email.com',
  notes: null,
  isActive: true,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

const updatedClient: Client = {
  ...currentClient,
  name: 'Cliente Atualizado',
  phone: '15981234567',
  updatedAt: '2026-05-02T00:00:00.000Z',
};

const validClientValues: ClientSchema = {
  name: updatedClient.name,
  phone: updatedClient.phone ?? '',
  document: updatedClient.document ?? '',
  email: updatedClient.email ?? '',
  notes: '',
};

describe('useClientForm', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('atualiza o cache da lista ao editar um cliente', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const listQueryKey = ['clientes', 1, DEFAULT_TABLE_PAGE_SIZE, ''];

    queryClient.setQueryData<PaginatedResponse<Client>>(listQueryKey, {
      data: [currentClient],
      page: 1,
      pageSize: DEFAULT_TABLE_PAGE_SIZE,
      total: 1,
      totalPages: 1,
    });
    vi.mocked(clientsService.getById).mockResolvedValue(currentClient);
    vi.mocked(clientsService.update).mockResolvedValue(updatedClient);

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useClientForm('edit', currentClient.id, onSuccess), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutation.mutateAsync(validClientValues);
    });

    await waitFor(() => {
      const cachedList = queryClient.getQueryData<PaginatedResponse<Client>>(listQueryKey);

      expect(cachedList?.data[0]).toMatchObject({
        id: updatedClient.id,
        name: updatedClient.name,
        phone: updatedClient.phone,
      });
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalledWith('Cliente salvo com sucesso.');
  });
});
