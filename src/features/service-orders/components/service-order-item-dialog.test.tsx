import { fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ServiceOrderItemDialog } from '@/features/service-orders/components/service-order-item-dialog';
import { renderWithProviders } from '@/test/render-with-providers';

vi.mock('@/features/reference-data/hooks/use-inventory-options', () => ({
  useInventoryOptions: () => ({
    isLoading: false,
    data: [
      {
        label: 'FO-001 - Filtro de oleo',
        value: 'inv-1',
        name: 'Filtro de oleo',
        internalCode: 'FO-001',
        salePrice: 45,
      },
    ],
  }),
}));

vi.mock('@/features/reference-data/hooks/use-service-options', () => ({
  useServiceOptions: () => ({
    isLoading: false,
    data: [
      {
        label: 'Troca de oleo',
        value: 'service-1',
        code: 'SRV-001',
        description: 'Troca de oleo',
        suggestedTotalPrice: 100,
      },
    ],
  }),
}));

describe('ServiceOrderItemDialog', () => {
  it('edita uma peca prevista sem apresentar consumo de estoque', () => {
    const onSubmit = vi.fn();

    renderWithProviders(
      <ServiceOrderItemDialog
        item={{
          id: 'execution-item-1',
          type: 'PART',
          inventoryItemId: 'inv-1',
          serviceCode: null,
          description: 'Filtro de oleo',
          quantity: 1,
          unitPrice: 45,
          totalPrice: 45,
          inventoryItem: { id: 'inv-1', name: 'Filtro de oleo', internalCode: 'FO-001' },
        }}
        isSubmitting={false}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText(/sem modificar o orçamento aprovado/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/quantidade/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar item/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      type: 'PART',
      serviceCatalogItemId: null,
      inventoryItemId: 'inv-1',
      description: 'Filtro de oleo',
      quantity: 2,
      unitPrice: 45,
    });
  });

  it('permite corrigir mao de obra para mao de obra com peca', () => {
    const onSubmit = vi.fn();

    renderWithProviders(
      <ServiceOrderItemDialog
        item={{
          id: 'execution-item-2',
          type: 'LABOR',
          serviceCatalogItemId: 'service-1',
          inventoryItemId: null,
          serviceCode: 'SRV-001',
          description: 'Troca de oleo',
          quantity: 1,
          unitPrice: 100,
          totalPrice: 100,
          inventoryItem: null,
        }}
        isSubmitting={false}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByLabelText('Tipo'));
    fireEvent.click(screen.getByText('Mão de obra + peça'));
    fireEvent.click(screen.getByLabelText('Peça ou produto'));
    fireEvent.click(screen.getByText('FO-001 - Filtro de oleo'));
    fireEvent.click(screen.getByRole('button', { name: /salvar item/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      type: 'LABOR_AND_PART',
      serviceCatalogItemId: 'service-1',
      inventoryItemId: 'inv-1',
      description: 'Troca de oleo + Filtro de oleo',
      quantity: 1,
      unitPrice: 145,
    });
  });
});
