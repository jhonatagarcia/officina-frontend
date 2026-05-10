import { fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { BudgetFormPage } from '@/features/budgets/pages/budget-form-page';
import { renderWithProviders } from '@/test/render-with-providers';

const clientOptionsRefetchMock = vi.fn();
const vehicleOptionsRefetchMock = vi.fn();
const budgetRefetchMock = vi.fn();

vi.mock('@/features/reference-data/hooks/use-client-options', () => ({
  useClientOptions: () => ({
    isLoading: false,
    isError: true,
    data: undefined,
    refetch: clientOptionsRefetchMock,
  }),
}));

vi.mock('@/features/reference-data/hooks/use-vehicle-options', () => ({
  useVehicleOptions: () => ({
    isLoading: false,
    isError: true,
    data: undefined,
    refetch: vehicleOptionsRefetchMock,
  }),
}));

vi.mock('@/features/budgets/hooks/use-budget-form', () => ({
  useBudgetForm: () => ({
    budgetQuery: {
      isLoading: false,
      isError: true,
      refetch: budgetRefetchMock,
    },
    form: {
      watch: vi.fn(() => ''),
      setValue: vi.fn(),
    },
    fieldArray: {},
    mutation: {
      isPending: false,
      mutate: vi.fn(),
    },
    items: [],
    discount: 0,
    total: 0,
  }),
}));

describe('BudgetFormPage', () => {
  it('refaz query principal e queries auxiliares ao tentar novamente', () => {
    renderWithProviders(<BudgetFormPage mode="create" />);

    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));

    expect(budgetRefetchMock).toHaveBeenCalledTimes(1);
    expect(clientOptionsRefetchMock).toHaveBeenCalledTimes(1);
    expect(vehicleOptionsRefetchMock).toHaveBeenCalledTimes(1);
  });
});
