import { fireEvent, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { vi } from 'vitest';
import { VehicleFormPage } from '@/features/vehicles/pages/vehicle-form-page';
import type { VehicleSchema } from '@/features/vehicles/schemas/vehicle-schema';
import { renderWithProviders } from '@/test/render-with-providers';

const vehicleRefetchMock = vi.fn();
const clientOptionsRefetchMock = vi.fn();
const mutateMock = vi.fn();

vi.mock('@/features/reference-data/hooks/use-client-options', () => ({
  useClientOptions: () => ({
    isLoading: false,
    isError: true,
    data: undefined,
    refetch: clientOptionsRefetchMock,
  }),
}));

vi.mock('@/features/vehicles/hooks/use-vehicle-form', () => ({
  useVehicleForm: () => {
    const form = useForm<VehicleSchema>({
      defaultValues: {
        clientId: '',
        plate: '',
        brand: '',
        model: '',
        year: 2026,
        color: '',
        mileage: 0,
        fuel: '',
        notes: '',
      },
    });

    return {
      query: {
        isLoading: false,
        isError: true,
        refetch: vehicleRefetchMock,
      },
      form,
      mutation: {
        isPending: false,
        mutate: mutateMock,
      },
    };
  },
}));

describe('VehicleFormPage', () => {
  it('refaz query principal e opcoes auxiliares ao tentar novamente', () => {
    renderWithProviders(<VehicleFormPage mode="create" />);

    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));

    expect(vehicleRefetchMock).toHaveBeenCalledTimes(1);
    expect(clientOptionsRefetchMock).toHaveBeenCalledTimes(1);
  });
});
