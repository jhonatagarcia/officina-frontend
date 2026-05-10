import { fireEvent, screen } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';
import { vi } from 'vitest';
import { InventoryQuantityChangeDialog } from '@/features/inventory/components/inventory-quantity-change-dialog';
import type { InventoryItemSchema } from '@/features/inventory/schemas/inventory-item-schema';
import type { InventoryMovement } from '@/features/inventory/types';
import { renderWithProviders } from '@/test/render-with-providers';

const pendingValues: InventoryItemSchema = {
  name: 'Filtro de oleo',
  category: 'Lubrificacao',
  supplier: 'Fornecedor A',
  quantity: 8,
  minimumQuantity: 2,
  cost: 10,
  salePrice: 25,
};

function makeMovementsQuery(overrides: Partial<UseQueryResult<InventoryMovement[]>>): UseQueryResult<InventoryMovement[]> {
  return {
    data: undefined,
    isLoading: false,
    ...overrides,
  } as UseQueryResult<InventoryMovement[]>;
}

describe('InventoryQuantityChangeDialog', () => {
  it('mostra resumo da alteracao e aciona confirmacao ou cancelamento', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    renderWithProviders(
      <InventoryQuantityChangeDialog
        currentQuantity={5}
        isPending={false}
        movementsQuery={makeMovementsQuery({ data: [] })}
        pendingValues={pendingValues}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText('Confirmar alteração manual de estoque')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma movimentação registrada para este produto.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar alteração/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('mostra loading e desabilita confirmacao enquanto salva', () => {
    renderWithProviders(
      <InventoryQuantityChangeDialog
        currentQuantity={10}
        isPending
        movementsQuery={makeMovementsQuery({ isLoading: true })}
        pendingValues={{ ...pendingValues, quantity: 4 }}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText('-6')).toBeInTheDocument();
    expect(screen.getByText('Carregando movimentações...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar alteração/i })).toBeDisabled();
  });

  it('lista movimentacoes recentes com vinculo de OS ou motivo manual', () => {
    renderWithProviders(
      <InventoryQuantityChangeDialog
        currentQuantity={5}
        isPending={false}
        movementsQuery={makeMovementsQuery({
          data: [
            {
              id: 'mov-1',
              inventoryItemId: 'inv-1',
              serviceOrderId: 'os-1',
              serviceOrderPartId: 'part-1',
              type: 'OUT',
              quantityChange: -2,
              quantityBefore: 7,
              quantityAfter: 5,
              unitCost: 10,
              totalCost: 20,
              reason: null,
              createdAt: '2026-05-01T00:00:00.000Z',
              serviceOrder: {
                id: 'os-1',
                orderNumber: 'OS-42',
                status: 'EM_ANDAMENTO',
                client: {
                  id: 'client-1',
                  name: 'Carlos Lima',
                },
              },
            },
            {
              id: 'mov-2',
              inventoryItemId: 'inv-1',
              serviceOrderId: null,
              serviceOrderPartId: null,
              type: 'ADJUSTMENT',
              quantityChange: 1,
              quantityBefore: 4,
              quantityAfter: 5,
              unitCost: null,
              totalCost: null,
              reason: 'Conferencia fisica',
              createdAt: '2026-05-02T00:00:00.000Z',
              serviceOrder: null,
            },
          ],
        })}
        pendingValues={pendingValues}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText('Saída por OS · -2')).toBeInTheDocument();
    expect(screen.getByText('OS000042 · Carlos Lima')).toBeInTheDocument();
    expect(screen.getByText('Ajuste manual · 1')).toBeInTheDocument();
    expect(screen.getByText('Conferencia fisica')).toBeInTheDocument();
    expect(screen.getByText('R$ 20,00')).toBeInTheDocument();
  });
});
