import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ServiceOrderDetailsPage } from '@/features/service-orders/pages/service-order-details-page';
import { mechanicsService } from '@/features/mechanics/services/mechanics-service';
import { serviceOrdersService } from '@/features/service-orders/services/service-orders-service';
import { renderWithProviders } from '@/test/render-with-providers';
import type { ServiceOrder } from '@/features/service-orders/types';

vi.mock('react-router-dom', async (importOriginal) => {
  const original = await importOriginal<typeof import('react-router-dom')>();
  return { ...original, useParams: () => ({ id: 'os-1' }), useSearchParams: () => [new URLSearchParams('mode=operate')] };
});

vi.mock('@/features/service-orders/services/service-orders-service', () => ({
  serviceOrdersService: {
    getById: vi.fn(), updateStatus: vi.fn(), update: vi.fn(), listPendingParts: vi.fn(), createPendingPart: vi.fn(),
    updatePendingPart: vi.fn(), cancelPendingPart: vi.fn(), listParts: vi.fn(), addPart: vi.fn(), addService: vi.fn(),
    removePart: vi.fn(), updateItem: vi.fn(), removeItem: vi.fn(), resumeAfterPartsArrival: vi.fn(),
  },
}));
vi.mock('@/features/mechanics/services/mechanics-service', () => ({ mechanicsService: { list: vi.fn() } }));
vi.mock('@/features/reference-data/hooks/use-service-options', () => ({
  useServiceOptions: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/features/reference-data/hooks/use-inventory-options', () => ({
  useInventoryOptions: () => ({ data: [], isLoading: false }),
}));

const order: ServiceOrder = {
  id: 'os-1', orderNumber: 'OS-001', budgetId: null, clientId: 'client-1', vehicleId: 'vehicle-1', mechanicId: null,
  clientName: 'Cliente de teste', vehicleLabel: 'ABC-1D23', mechanicName: null, problemDescription: 'Ruído', diagnosis: null,
  servicesPerformed: null, vehicleChecklist: null, openedAt: '2026-01-01T12:00:00.000Z', expectedDeliveryAt: null,
  finishedAt: null, deliveredAt: null, status: 'ABERTA', notes: null, createdAt: '2026-01-01T12:00:00.000Z', updatedAt: '2026-01-01T12:00:00.000Z',
  budgetItems: [], executionItems: [], parts: [], pendingParts: [],
};

function mockDetail(orderResult: ServiceOrder = order) {
  vi.mocked(serviceOrdersService.getById).mockResolvedValue(orderResult);
  vi.mocked(mechanicsService.list).mockResolvedValue({ data: [], page: 1, pageSize: 100, total: 0, totalPages: 1 });
}

describe('ServiceOrderDetailsPage', () => {
  it('mostra erro seguro quando o detalhe não carrega', async () => {
    vi.mocked(serviceOrdersService.getById).mockRejectedValue(new Error('DATABASE_URL-secret'));
    vi.mocked(mechanicsService.list).mockResolvedValue({ data: [], page: 1, pageSize: 100, total: 0, totalPages: 1 });

    renderWithProviders(<ServiceOrderDetailsPage />);

    expect(await screen.findByText('Falha ao carregar os dados')).toBeInTheDocument();
    expect(screen.queryByText('DATABASE_URL-secret')).not.toBeInTheDocument();
  });

  it('atualiza status permitido da OS', async () => {
    const user = userEvent.setup();
    mockDetail();
    vi.mocked(serviceOrdersService.updateStatus).mockResolvedValue({ ...order, status: 'EM_ANDAMENTO' });

    renderWithProviders(<ServiceOrderDetailsPage />);

    await user.click(await screen.findByRole('combobox', { name: 'Novo status da OS' }));
    await user.click(screen.getByRole('option', { name: 'Em andamento' }));
    await user.click(screen.getByRole('button', { name: 'Atualizar status' }));

    await waitFor(() => expect(serviceOrdersService.updateStatus).toHaveBeenCalledWith('os-1', 'EM_ANDAMENTO'));
  });
});
