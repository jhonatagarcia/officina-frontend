import { fireEvent, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { InventoryRelatedOrdersDialog } from '@/features/inventory/components/inventory-related-orders-dialog';
import { serviceOrdersService } from '@/features/service-orders/services/service-orders-service';
import type { RelatedPendingServiceOrders } from '@/features/inventory/types';
import { renderWithProviders } from '@/test/render-with-providers';

vi.mock('@/features/service-orders/services/service-orders-service', () => ({
  serviceOrdersService: {
    resumeAfterPartsArrival: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const related: RelatedPendingServiceOrders = {
  count: 1,
  items: [
    {
      serviceOrderId: 'os-1',
      orderNumber: 'OS-42',
      clientName: 'Carlos Lima',
      vehiclePlate: 'ABC1D23',
      pendingPartId: 'pending-1',
      inventoryItemId: 'inv-1',
      quantityRequired: 2,
      quantityAvailable: 3,
      status: 'AVAILABLE',
      suggestedAction: 'RESUME_SERVICE_ORDER',
    },
  ],
};

describe('InventoryRelatedOrdersDialog', () => {
  it('exibe sugestao apos reposicao sem retomar automaticamente', () => {
    renderWithProviders(
      <InventoryRelatedOrdersDialog open related={related} onOpenChange={vi.fn()} onCloseWithoutAction={vi.fn()} />,
    );

    expect(screen.getByText('Peça reposta com sucesso')).toBeInTheDocument();
    expect(screen.getByText('Essa peça atende 1 ordem de serviço aguardando peça.')).toBeInTheDocument();
    expect(screen.getByText('OS000042')).toBeInTheDocument();
    expect(screen.getByText('Carlos Lima')).toBeInTheDocument();
    expect(serviceOrdersService.resumeAfterPartsArrival).not.toHaveBeenCalled();
  });

  it('pede confirmacao antes de chamar retomada', async () => {
    vi.mocked(serviceOrdersService.resumeAfterPartsArrival).mockResolvedValueOnce({
      id: 'os-1',
      orderNumber: 'OS-42',
      budgetId: null,
      clientId: 'client-1',
      vehicleId: 'vehicle-1',
      mechanicId: null,
      clientName: 'Carlos Lima',
      vehicleLabel: 'ABC1D23',
      mechanicName: null,
      problemDescription: 'Motor falhando',
      diagnosis: null,
      servicesPerformed: null,
      vehicleChecklist: null,
      openedAt: '2026-05-24T00:00:00.000Z',
      expectedDeliveryAt: null,
      finishedAt: null,
      deliveredAt: null,
      status: 'EM_ANDAMENTO',
      notes: null,
      createdAt: '2026-05-24T00:00:00.000Z',
      updatedAt: '2026-05-24T00:00:00.000Z',
    });

    renderWithProviders(
      <InventoryRelatedOrdersDialog open related={related} onOpenChange={vi.fn()} onCloseWithoutAction={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /retomar os/i }));
    expect(serviceOrdersService.resumeAfterPartsArrival).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /^retomar os$/i }));

    await waitFor(() => {
      expect(serviceOrdersService.resumeAfterPartsArrival).toHaveBeenCalledWith('os-1');
    });
  });

  it('permite ignorar a sugestao', () => {
    const onCloseWithoutAction = vi.fn();

    renderWithProviders(
      <InventoryRelatedOrdersDialog open related={related} onOpenChange={vi.fn()} onCloseWithoutAction={onCloseWithoutAction} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /agora não/i }));
    expect(onCloseWithoutAction).toHaveBeenCalledTimes(1);
  });

  it('nao mostra retomar OS quando a OS relacionada ja esta em andamento', () => {
    renderWithProviders(
      <InventoryRelatedOrdersDialog
        open
        related={{
          ...related,
          items: related.items.map((item) => ({ ...item, serviceOrderStatus: 'EM_ANDAMENTO' })),
        }}
        onOpenChange={vi.fn()}
        onCloseWithoutAction={vi.fn()}
      />,
    );

    expect(screen.getByText('Peça disponível')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retomar os/i })).not.toBeInTheDocument();
  });
});
