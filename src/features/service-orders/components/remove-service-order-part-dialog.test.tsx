import { fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { RemoveServiceOrderPartDialog } from '@/features/service-orders/components/remove-service-order-part-dialog';
import type { ServiceOrderPart } from '@/features/service-orders/types';
import { renderWithProviders } from '@/test/render-with-providers';

const part: ServiceOrderPart = {
  id: 'part-1',
  serviceOrderId: 'os-1',
  inventoryItemId: 'item-1',
  quantity: 2,
  unitPrice: 45,
  totalPrice: 90,
  createdAt: '2026-05-25T10:00:00.000Z',
  updatedAt: '2026-05-25T10:00:00.000Z',
  inventoryItem: {
    id: 'item-1',
    name: 'Filtro de oleo',
    internalCode: 'FO-001',
  },
};

describe('RemoveServiceOrderPartDialog', () => {
  it('confirma a remocao informando que a quantidade volta ao estoque', () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <RemoveServiceOrderPartDialog
        part={part}
        isSubmitting={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText(/devolvida ao estoque/i)).toBeInTheDocument();
    expect(screen.getByText(/FO-001 - Quantidade: 2/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /remover peça/i }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('permite cancelar sem remover a peca', () => {
    const onCancel = vi.fn();
    renderWithProviders(
      <RemoveServiceOrderPartDialog
        part={part}
        isSubmitting={false}
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
