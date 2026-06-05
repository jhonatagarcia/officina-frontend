import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { vi } from 'vitest';
import { useVehicleForm } from '@/features/vehicles/hooks/use-vehicle-form';
import type { VehicleSchema } from '@/features/vehicles/schemas/vehicle-schema';
import { vehiclesService } from '@/features/vehicles/services/vehicles-service';

const { toastErrorMock } = vi.hoisted(() => ({
  toastErrorMock: vi.fn(),
}));

vi.mock('@/features/vehicles/services/vehicles-service', () => ({
  vehiclesService: {
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
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

const validVehicle: VehicleSchema = {
  clientId: 'client-1',
  plate: 'ABC1D23',
  brand: 'Fiat',
  model: 'Uno',
  year: 2020,
  color: '',
  mileage: 1000,
  fuel: '',
  notes: '',
};

describe('useVehicleForm', () => {
  it('direciona conflito 409 de placa para o campo plate', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.mocked(vehiclesService.create).mockRejectedValueOnce({
      statusCode: 409,
      message: 'Já existe um veículo cadastrado com esta placa.',
    });

    const { result } = renderHook(() => useVehicleForm('create', '', vi.fn()), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await expect(result.current.mutation.mutateAsync(validVehicle)).rejects.toMatchObject({ statusCode: 409 });
    });

    await waitFor(() => {
      expect(result.current.form.formState.errors.plate?.message).toBe('Já existe um veículo cadastrado com esta placa.');
    });
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it('mantem erro generico no toast quando falha nao e conflito', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.mocked(vehiclesService.create).mockRejectedValueOnce({
      statusCode: 500,
      message: 'Não foi possível salvar o veículo.',
    });

    const { result } = renderHook(() => useVehicleForm('create', '', vi.fn()), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await expect(result.current.mutation.mutateAsync(validVehicle)).rejects.toMatchObject({ statusCode: 500 });
    });

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Não foi possível salvar o veículo.');
    });
    expect(result.current.form.formState.errors.plate).toBeUndefined();
  });
});
