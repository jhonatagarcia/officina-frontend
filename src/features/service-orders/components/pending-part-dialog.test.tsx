import { fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { PendingPartDialog } from '@/features/service-orders/components/pending-part-dialog';
import { renderWithProviders } from '@/test/render-with-providers';

vi.mock('@/features/reference-data/hooks/use-inventory-options', () => ({
  useInventoryOptions: () => ({
    isLoading: false,
    data: [
      {
        label: 'FO-001 • Filtro de óleo',
        value: 'inv-1',
        quantity: 4,
      },
      {
        label: 'PA-001 • Pastilha de freio',
        value: 'inv-2',
        quantity: 0,
      },
    ],
  }),
}));

describe('PendingPartDialog', () => {
  it('cadastra peca pendente com item e quantidade', () => {
    const onSubmit = vi.fn();

    renderWithProviders(
      <PendingPartDialog open isSubmitting={false} onOpenChange={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.click(screen.getByText('Selecione a peça'));
    fireEvent.click(screen.getByText('FO-001 • Filtro de óleo'));
    fireEvent.change(screen.getByLabelText(/quantidade/i), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/observação opcional/i), { target: { value: 'Fornecedor confirmou' } });
    fireEvent.change(screen.getByLabelText(/previsão de chegada opcional/i), { target: { value: '2026-05-30' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar peça/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      inventoryItemId: 'inv-1',
      quantityRequired: 3,
      note: 'Fornecedor confirmou',
      expectedArrivalAt: '2026-05-30',
    });
  });

  it('desabilita salvar enquanto nao ha peca selecionada', () => {
    renderWithProviders(
      <PendingPartDialog open isSubmitting={false} onOpenChange={vi.fn()} onSubmit={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: /salvar peça/i })).toBeDisabled();
  });

  it('mostra o estoque atual ao editar uma peca pendente', () => {
    renderWithProviders(
      <PendingPartDialog
        open
        pendingPart={{
          id: 'pending-1',
          serviceOrderId: 'os-1',
          inventoryItemId: 'inv-1',
          quantityRequired: 2,
          quantityAvailable: 0,
          status: 'PENDING',
          note: null,
          expectedArrivalAt: null,
          resolvedAt: null,
          canceledAt: null,
          createdAt: '2026-05-24T00:00:00.000Z',
          updatedAt: '2026-05-24T00:00:00.000Z',
          inventoryItem: { id: 'inv-1', name: 'Filtro de óleo', internalCode: 'FO-001', quantity: 0 },
        }}
        isSubmitting={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText(/Disponível em estoque:/)).toHaveTextContent('Disponível em estoque: 4');
    expect(screen.getByText(/Disponível em estoque:/).parentElement).not.toHaveTextContent('Quantidade necessária');
  });

  it('avisa quando a peca selecionada nao tem estoque disponivel', () => {
    renderWithProviders(
      <PendingPartDialog open isSubmitting={false} onOpenChange={vi.fn()} onSubmit={vi.fn()} />,
    );

    fireEvent.click(screen.getByText('Selecione a peça'));
    fireEvent.click(screen.getByText('PA-001 • Pastilha de freio'));

    expect(screen.getByText('Produto não disponível em estoque. Será necessário efetuar a compra do produto.')).toBeInTheDocument();
  });
});
