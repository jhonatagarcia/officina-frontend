import { fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ServiceOrderStockPartDialog } from '@/features/service-orders/components/service-order-stock-part-dialog';
import { renderWithProviders } from '@/test/render-with-providers';

vi.mock('@/features/reference-data/hooks/use-inventory-options', () => ({
  useInventoryOptions: () => ({
    isLoading: false,
    data: [
      {
        label: 'FO-001 • Filtro de óleo',
        value: 'inv-1',
        name: 'Filtro de óleo',
        internalCode: 'FO-001',
        quantity: 3,
        salePrice: 45,
      },
    ],
  }),
}));

describe('ServiceOrderStockPartDialog', () => {
  it('envia a peça disponível usando o payload existente do endpoint de peças', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <ServiceOrderStockPartDialog open isSubmitting={false} onOpenChange={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.click(screen.getByText('Selecione a peça'));
    fireEvent.click(screen.getByText('FO-001 • Filtro de óleo'));
    fireEvent.change(screen.getByLabelText(/quantidade necessária/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /aplicar na os/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      inventoryItemId: 'inv-1',
      quantity: 2,
      unitPrice: 45,
    });
  });

  it('bloqueia aplicação quando a quantidade necessária supera o estoque', () => {
    renderWithProviders(
      <ServiceOrderStockPartDialog open isSubmitting={false} onOpenChange={vi.fn()} onSubmit={vi.fn()} />,
    );

    fireEvent.click(screen.getByText('Selecione a peça'));
    fireEvent.click(screen.getByText('FO-001 • Filtro de óleo'));
    fireEvent.change(screen.getByLabelText(/quantidade necessária/i), { target: { value: '4' } });

    expect(screen.getByText(/estoque insuficiente/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aplicar na os/i })).toBeDisabled();
  });
});
