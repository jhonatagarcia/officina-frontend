import { fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { RemoveServiceOrderItemDialog } from '@/features/service-orders/components/remove-service-order-item-dialog';
import type { ServiceOrderBudgetItem } from '@/features/service-orders/types';
import { renderWithProviders } from '@/test/render-with-providers';

const item: ServiceOrderBudgetItem = {
  id: 'execution-item-1',
  type: 'LABOR',
  serviceCatalogItemId: 'service-1',
  inventoryItemId: null,
  serviceCode: 'SRV-001',
  description: 'Troca de oleo',
  quantity: 1,
  unitPrice: 100,
  totalPrice: 100,
  inventoryItem: null,
};

describe('RemoveServiceOrderItemDialog', () => {
  it('explica o impacto e confirma a exclusao do item', () => {
    const onConfirm = vi.fn();

    renderWithProviders(
      <RemoveServiceOrderItemDialog
        item={item}
        isSubmitting={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText(/orçamento aprovado e o estoque não serão alterados/i)).toBeInTheDocument();
    expect(screen.getByText('Troca de oleo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /excluir item/i }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
