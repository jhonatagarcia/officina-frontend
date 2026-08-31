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

vi.mock('@/features/reference-data/hooks/use-service-options', () => ({
  useServiceOptions: () => ({
    isLoading: false,
    data: [
      {
        label: 'Troca de óleo',
        value: 'svc-1',
        code: 'SRV-001',
        description: 'Troca de óleo',
        suggestedTotalPrice: 120,
      },
    ],
  }),
}));

describe('ServiceOrderStockPartDialog', () => {
  it('adiciona um novo serviço sem peça vinculada', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <ServiceOrderStockPartDialog open isSubmitting={false} onOpenChange={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.click(screen.getByText('Selecione o serviço'));
    fireEvent.click(screen.getByText('Troca de óleo'));
    fireEvent.change(screen.getByLabelText(/quantidade/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /adicionar serviço/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      serviceCatalogItemId: 'svc-1',
      inventoryItemId: null,
      description: 'Troca de óleo',
      quantity: 2,
      unitPrice: 120,
    });
  });

  it('adiciona um novo serviço com peça vinculada', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <ServiceOrderStockPartDialog open isSubmitting={false} onOpenChange={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.click(screen.getByText('Selecione o serviço'));
    fireEvent.click(screen.getByText('Troca de óleo'));
    fireEvent.click(screen.getByText('Sem peça vinculada'));
    fireEvent.click(screen.getByText('FO-001 • Filtro de óleo'));
    fireEvent.change(screen.getByLabelText(/quantidade/i), { target: { value: '2' } });

    expect(screen.getByText('R$ 330,00')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /adicionar serviço/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      serviceCatalogItemId: 'svc-1',
      inventoryItemId: 'inv-1',
      description: 'Troca de óleo + Filtro de óleo',
      quantity: 2,
      unitPrice: 120,
    });
  });
});
