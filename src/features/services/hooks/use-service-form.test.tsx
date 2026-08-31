import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { vi } from 'vitest';
import { useServiceForm } from '@/features/services/hooks/use-service-form';
import type { ServiceCatalogSchema } from '@/features/services/schemas/service-catalog-schema';
import { servicesService } from '@/features/services/services/services-service';

const { toastErrorMock } = vi.hoisted(() => ({
  toastErrorMock: vi.fn(),
}));

vi.mock('@/features/services/services/services-service', () => ({
  servicesService: {
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
    success: vi.fn(),
  },
}));

function createWrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

const validService: ServiceCatalogSchema = {
  name: 'Synthetic service',
  category: 'Synthetic category',
  description: '',
  internalNotes: '',
  laborPrice: 100,
  productPrice: 0,
  billingType: 'LABOR_ONLY',
  materialSource: 'NO_PARTS_REQUIRED',
  warrantyDays: undefined,
  active: true,
};

describe('useServiceForm', () => {
  it('marks name only for an identified name and category conflict', async () => {
    vi.mocked(servicesService.create).mockRejectedValueOnce({
      statusCode: 409,
      message: 'Já existe um serviço com este nome na categoria informada nesta oficina.',
      code: 'SERVICE_NAME_CATEGORY_CONFLICT',
      field: 'name',
    });
    const { result } = renderHook(() => useServiceForm('create', '', vi.fn()), {
      wrapper: createWrapper(createQueryClient()),
    });

    await act(async () => {
      await expect(result.current.mutation.mutateAsync(validService)).rejects.toMatchObject({
        code: 'SERVICE_NAME_CATEGORY_CONFLICT',
      });
    });

    await waitFor(() => {
      expect(result.current.form.formState.errors.name?.message).toContain(
        'nome na categoria',
      );
    });
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it.each([
    ['SERVICE_CODE_CONFLICT', 'code'],
    ['SERVICE_CONFLICT', undefined],
  ])('keeps %s outside the name field', async (code, field) => {
    vi.mocked(servicesService.create).mockRejectedValueOnce({
      statusCode: 409,
      message: 'Não foi possível salvar o serviço devido a um conflito.',
      code,
      field,
    });
    const { result } = renderHook(() => useServiceForm('create', '', vi.fn()), {
      wrapper: createWrapper(createQueryClient()),
    });

    await act(async () => {
      await expect(result.current.mutation.mutateAsync(validService)).rejects.toMatchObject({
        code,
      });
    });

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Não foi possível salvar o serviço devido a um conflito.',
      );
    });
    expect(result.current.form.formState.errors.name).toBeUndefined();
  });
});
