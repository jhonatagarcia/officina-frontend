import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useBudgetForm } from '@/features/budgets/hooks/use-budget-form';
import { budgetsService } from '@/features/budgets/services/budgets-service';
import type { Budget } from '@/features/budgets/types';

vi.mock('@/features/budgets/services/budgets-service', () => ({
  budgetsService: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

const budget: Budget = {
  id: 'budget-1',
  code: 'ORC-001',
  clientId: 'client-1',
  vehicleId: 'vehicle-1',
  status: 'PENDENTE',
  problemDescription: 'Ruido na suspensao',
  notes: null,
  subtotal: 100,
  discount: 0,
  total: 100,
  convertedToServiceOrder: false,
  approvedAt: null,
  rejectedAt: null,
  createdAt: '2026-05-25T00:00:00.000Z',
  updatedAt: '2026-05-25T00:00:00.000Z',
  items: [],
};

const budgetWithItems: Budget = {
  ...budget,
  items: [
    {
      id: 'item-1',
      budgetId: 'budget-1',
      type: 'LABOR',
      serviceCatalogItemId: 'service-1',
      inventoryItemId: null,
      serviceCode: 'SRV-001',
      description: 'Diagnostico',
      quantity: 1,
      unitPrice: 100,
      totalPrice: 100,
      createdAt: '2026-05-25T00:00:00.000Z',
      updatedAt: '2026-05-25T00:00:00.000Z',
    },
    {
      id: 'item-2',
      budgetId: 'budget-1',
      type: 'PART',
      serviceCatalogItemId: null,
      inventoryItemId: 'inventory-1',
      serviceCode: null,
      description: 'Pastilha',
      quantity: 2,
      unitPrice: 50,
      totalPrice: 100,
      createdAt: '2026-05-25T00:00:00.000Z',
      updatedAt: '2026-05-25T00:00:00.000Z',
    },
  ],
};

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useBudgetForm', () => {
  it('mantem item removido fora do formulario sem reidratar do cache', async () => {
    vi.mocked(budgetsService.getById).mockResolvedValueOnce(budgetWithItems);

    const { result } = renderHook(
      () => useBudgetForm('edit', 'budget-1', vi.fn()),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });

    act(() => {
      result.current.fieldArray.remove(0);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]?.description).toBe('Pastilha');
  });

  it('usa atualização ao salvar orçamento em modo edição', async () => {
    vi.mocked(budgetsService.getById).mockResolvedValueOnce(budget);
    vi.mocked(budgetsService.update).mockResolvedValueOnce(budget);

    const { result } = renderHook(
      () => useBudgetForm('edit', 'budget-1', vi.fn()),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.mutation.mutateAsync({
        clientId: 'client-1',
        vehicleId: 'vehicle-1',
        problemDescription: 'Ruido na suspensao',
        notes: '',
        discount: 0,
        items: [
          {
            type: 'LABOR',
            serviceCatalogItemId: 'service-1',
            inventoryItemId: '',
            serviceCode: 'SRV-001',
            description: 'Inspecao',
            quantity: 1,
            unitPrice: 100,
          },
        ],
      });
    });

    expect(budgetsService.update).toHaveBeenCalledWith(
      'budget-1',
      expect.objectContaining({
        problemDescription: 'Ruido na suspensao',
        items: [expect.objectContaining({ description: 'Inspecao' })],
      }),
    );
    expect(budgetsService.create).not.toHaveBeenCalled();
  });
});
