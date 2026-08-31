import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { vi } from 'vitest';
import { useInventoryForm } from '@/features/inventory/hooks/use-inventory-form';
import type { InventoryItemSchema } from '@/features/inventory/schemas/inventory-item-schema';
import { inventoryService } from '@/features/inventory/services/inventory-service';

const { toastErrorMock } = vi.hoisted(() => ({
  toastErrorMock: vi.fn(),
}));

vi.mock('@/features/inventory/services/inventory-service', () => ({
  inventoryService: {
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

const validInventoryItem: InventoryItemSchema = {
  name: 'Synthetic item',
  category: 'Synthetic category',
  supplier: '',
  quantity: 1,
  minimumQuantity: 0,
  cost: 1,
  salePrice: 2,
};

describe('useInventoryForm', () => {
  it('shows a safe identified internal-code conflict as a general form message', async () => {
    vi.mocked(inventoryService.create).mockRejectedValueOnce({
      statusCode: 409,
      message: 'Já existe um item com este código interno nesta oficina.',
      code: 'INVENTORY_INTERNAL_CODE_CONFLICT',
      field: 'internalCode',
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const { result } = renderHook(() => useInventoryForm('create', '', vi.fn()), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await expect(result.current.mutation.mutateAsync(validInventoryItem)).rejects.toMatchObject({
        code: 'INVENTORY_INTERNAL_CODE_CONFLICT',
      });
    });

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Já existe um item com este código interno nesta oficina.',
      );
    });
    expect(result.current.form.formState.errors.name).toBeUndefined();
  });
});
