import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ServiceOrdersPage } from '@/features/service-orders/pages/service-orders-page';
import { serviceOrdersService } from '@/features/service-orders/services/service-orders-service';
import { renderWithProviders } from '@/test/render-with-providers';
import type { ServiceOrder } from '@/features/service-orders/types';

vi.mock('@/features/service-orders/services/service-orders-service', () => ({
  serviceOrdersService: { list: vi.fn() },
}));

const order: ServiceOrder = {
  id: 'os-1', orderNumber: 'OS-001', budgetId: null, clientId: 'client-1', vehicleId: 'vehicle-1', mechanicId: null,
  clientName: 'Cliente de teste', vehicleLabel: 'ABC-1D23', mechanicName: null, problemDescription: 'Ruído', diagnosis: null,
  servicesPerformed: null, vehicleChecklist: null, openedAt: '2026-01-01T12:00:00.000Z', expectedDeliveryAt: null,
  finishedAt: null, deliveredAt: null, status: 'ABERTA', notes: null, createdAt: '2026-01-01T12:00:00.000Z', updatedAt: '2026-01-01T12:00:00.000Z', total: 100,
};

function listResponse(data: ServiceOrder[]) {
  return { data, page: 1, pageSize: 20, total: data.length, totalPages: 1 };
}

describe('ServiceOrdersPage', () => {
  it('mostra carregamento enquanto consulta as ordens', () => {
    vi.mocked(serviceOrdersService.list).mockReturnValue(new Promise(() => {}));

    renderWithProviders(<ServiceOrdersPage />);

    expect(screen.getByText('Carregando dados...')).toBeInTheDocument();
  });

  it('mostra estado vazio quando não há OS', async () => {
    vi.mocked(serviceOrdersService.list).mockResolvedValue(listResponse([]));

    renderWithProviders(<ServiceOrdersPage />);

    expect(await screen.findByText('Nenhum registro encontrado')).toBeInTheDocument();
  });

  it('mostra erro seguro quando a listagem falha', async () => {
    vi.mocked(serviceOrdersService.list).mockRejectedValue(new Error('DATABASE_URL-secret'));

    renderWithProviders(<ServiceOrdersPage />);

    expect(await screen.findByText('Falha ao carregar os dados')).toBeInTheDocument();
    expect(screen.queryByText('DATABASE_URL-secret')).not.toBeInTheDocument();
  });

  it('renderiza OS aberta e permite acessar sua operação', async () => {
    vi.mocked(serviceOrdersService.list).mockResolvedValue(listResponse([order]));

    renderWithProviders(<ServiceOrdersPage />);

    expect(await screen.findByText('OS000001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Operar OS000001' })).toBeInTheDocument();
  });
});
