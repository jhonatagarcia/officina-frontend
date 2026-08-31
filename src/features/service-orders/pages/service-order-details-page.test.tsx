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
  return {
    ...original,
    useParams: () => ({ id: 'os-1' }),
    useSearchParams: () => [new URLSearchParams('mode=operate')],
  };
});

vi.mock('@/features/service-orders/services/service-orders-service', () => ({
  serviceOrdersService: {
    getById: vi.fn(),
    updateStatus: vi.fn(),
    update: vi.fn(),
    listPendingParts: vi.fn(),
    createPendingPart: vi.fn(),
    updatePendingPart: vi.fn(),
    cancelPendingPart: vi.fn(),
    listParts: vi.fn(),
    addPart: vi.fn(),
    addService: vi.fn(),
    removePart: vi.fn(),
    listReturnableConsumptions: vi.fn(),
    returnPart: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    resumeAfterPartsArrival: vi.fn(),
  },
}));
vi.mock('@/features/mechanics/services/mechanics-service', () => ({
  mechanicsService: { list: vi.fn() },
}));
vi.mock('@/features/reference-data/hooks/use-service-options', () => ({
  useServiceOptions: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/features/reference-data/hooks/use-inventory-options', () => ({
  useInventoryOptions: () => ({
    data: [{ value: 'inventory-1', label: 'Peça sintética', quantity: 0 }],
    isLoading: false,
  }),
}));

const order: ServiceOrder = {
  id: 'os-1',
  orderNumber: 'OS-001',
  budgetId: null,
  clientId: 'client-1',
  vehicleId: 'vehicle-1',
  mechanicId: null,
  clientName: 'Cliente de teste',
  vehicleLabel: 'ABC-1D23',
  mechanicName: null,
  problemDescription: 'Ruído',
  diagnosis: null,
  servicesPerformed: null,
  vehicleChecklist: null,
  openedAt: '2026-01-01T12:00:00.000Z',
  expectedDeliveryAt: null,
  finishedAt: null,
  deliveredAt: null,
  status: 'ABERTA',
  notes: null,
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
  client: {
    id: 'client-1',
    name: 'Cliente de teste',
    document: null,
    phone: '(11) 99999-9999',
  },
  budgetItems: [],
  executionItems: [],
  parts: [],
  pendingParts: [],
};

function mockDetail(orderResult: ServiceOrder = order) {
  vi.mocked(serviceOrdersService.getById).mockResolvedValue(orderResult);
  vi.mocked(mechanicsService.list).mockResolvedValue({
    data: [],
    page: 1,
    pageSize: 100,
    total: 0,
    totalPages: 1,
  });
}

describe('ServiceOrderDetailsPage', () => {
  it('mostra erro seguro quando o detalhe não carrega', async () => {
    vi.mocked(serviceOrdersService.getById).mockRejectedValue(
      new Error('DATABASE_URL-secret'),
    );
    vi.mocked(mechanicsService.list).mockResolvedValue({
      data: [],
      page: 1,
      pageSize: 100,
      total: 0,
      totalPages: 1,
    });

    renderWithProviders(<ServiceOrderDetailsPage />);

    expect(
      await screen.findByText('Falha ao carregar os dados'),
    ).toBeInTheDocument();
    expect(screen.queryByText('DATABASE_URL-secret')).not.toBeInTheDocument();
  });

  it('atualiza status permitido da OS', async () => {
    const user = userEvent.setup();
    mockDetail();
    vi.mocked(serviceOrdersService.updateStatus).mockResolvedValue({
      ...order,
      status: 'EM_ANDAMENTO',
    });

    renderWithProviders(<ServiceOrderDetailsPage />);

    await user.click(
      await screen.findByRole('combobox', { name: 'Novo status da OS' }),
    );
    await user.click(screen.getByRole('option', { name: 'Em andamento' }));
    await user.click(screen.getByRole('button', { name: 'Atualizar status' }));

    await waitFor(() =>
      expect(serviceOrdersService.updateStatus).toHaveBeenCalledWith(
        'os-1',
        'EM_ANDAMENTO',
      ),
    );
    expect(
      await screen.findByText('Avisar cliente pelo WhatsApp?'),
    ).toBeInTheDocument();
    expect(screen.getByText(/estágio de manutenção/i)).toBeInTheDocument();
  });

  it('oferece WhatsApp ao registrar uma peça pendente', async () => {
    const user = userEvent.setup();
    mockDetail();
    vi.mocked(serviceOrdersService.createPendingPart).mockResolvedValue({
      id: 'pending-part-1',
      serviceOrderId: 'os-1',
      inventoryItemId: 'inventory-1',
      quantityRequired: 1,
      quantityAvailable: 0,
      status: 'PENDING',
      note: null,
      expectedArrivalAt: null,
      resolvedAt: null,
      canceledAt: null,
      inventoryItem: {
        id: 'inventory-1',
        name: 'Peça sintética',
        internalCode: 'SYN-001',
        quantity: 0,
      },
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-01T12:00:00.000Z',
    });

    renderWithProviders(<ServiceOrderDetailsPage />);

    await user.click(
      await screen.findByRole('combobox', { name: 'Novo status da OS' }),
    );
    await user.click(screen.getByRole('option', { name: 'Aguardando peça' }));
    await user.click(screen.getByRole('button', { name: 'Atualizar status' }));
    await user.click(screen.getByRole('combobox', { name: 'Peça do estoque' }));
    await user.click(screen.getByRole('option', { name: 'Peça sintética' }));
    await user.click(screen.getByRole('button', { name: 'Salvar peça' }));

    await waitFor(() =>
      expect(serviceOrdersService.createPendingPart).toHaveBeenCalledWith(
        'os-1',
        {
          inventoryItemId: 'inventory-1',
          quantityRequired: 1,
          note: null,
          expectedArrivalAt: null,
        },
      ),
    );
    expect(
      await screen.findByText('Avisar cliente pelo WhatsApp?'),
    ).toBeInTheDocument();
    expect(screen.getByText(/peças para a manutenção/i)).toBeInTheDocument();
  });

  it('permite reabrir uma OS entregue apenas para alterar o status', async () => {
    const user = userEvent.setup();
    mockDetail({ ...order, status: 'ENTREGUE' });
    vi.mocked(serviceOrdersService.updateStatus).mockResolvedValue({
      ...order,
      status: 'EM_ANDAMENTO',
    });

    renderWithProviders(<ServiceOrderDetailsPage />);

    await user.click(
      await screen.findByRole('combobox', { name: 'Novo status da OS' }),
    );
    await user.click(screen.getByRole('option', { name: 'Em andamento' }));
    await user.click(screen.getByRole('button', { name: 'Atualizar status' }));
    await user.click(await screen.findByRole('button', { name: /confirmar/i }));

    await waitFor(() =>
      expect(serviceOrdersService.updateStatus).toHaveBeenCalledWith(
        'os-1',
        'EM_ANDAMENTO',
      ),
    );
  });

  it('devolve uma peça auditável sem prometer alteração de comissão', async () => {
    const user = userEvent.setup();
    const part = {
      id: 'part-1',
      serviceOrderId: 'os-1',
      inventoryItemId: 'inventory-1',
      quantity: 2,
      unitPrice: 50,
      totalPrice: 100,
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-01T12:00:00.000Z',
      inventoryItem: {
        id: 'inventory-1',
        name: 'Filtro sintético',
        internalCode: 'SYN-001',
      },
    };
    mockDetail({ ...order, parts: [part] });
    vi.mocked(
      serviceOrdersService.listReturnableConsumptions,
    ).mockResolvedValue([
      {
        id: 'movement-1',
        quantityConsumed: 2,
        quantityReturned: 0,
        quantityAvailable: 2,
        createdAt: '2026-01-01T12:00:00.000Z',
      },
    ]);
    vi.mocked(serviceOrdersService.returnPart).mockResolvedValue(part);

    renderWithProviders(<ServiceOrderDetailsPage />);

    await user.click(
      await screen.findByRole('button', {
        name: 'Remover Filtro sintético da OS',
      }),
    );
    expect(await screen.findByText('Remover peça da OS')).toBeInTheDocument();
    expect(screen.getByText(/não altera a comissão/i)).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Motivo'));
    await user.type(screen.getByLabelText('Motivo'), 'Cliente desistiu');
    await user.click(
      screen.getByRole('button', { name: 'Confirmar devolução' }),
    );

    await waitFor(() =>
      expect(serviceOrdersService.returnPart).toHaveBeenCalledWith(
        'os-1',
        'part-1',
        {
          consumptionMovementId: 'movement-1',
          quantity: 1,
          reason: 'Cliente desistiu',
        },
        expect.any(String),
      ),
    );
  });
});
