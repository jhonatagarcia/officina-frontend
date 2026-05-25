import { fireEvent, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { vi } from 'vitest';
import { PendingPartsCard } from '@/features/service-orders/components/pending-parts-card';
import type { ServiceOrderPendingPart } from '@/features/service-orders/types';
import { renderWithProviders } from '@/test/render-with-providers';

const pendingPart: ServiceOrderPendingPart = {
  id: 'pending-1',
  serviceOrderId: 'os-1',
  inventoryItemId: 'inv-1',
  quantityRequired: 2,
  quantityAvailable: 0,
  status: 'PENDING',
  note: 'Fornecedor confirmou entrega',
  expectedArrivalAt: '2026-05-30T00:00:00.000Z',
  resolvedAt: null,
  canceledAt: null,
  createdAt: '2026-05-24T00:00:00.000Z',
  updatedAt: '2026-05-24T00:00:00.000Z',
  inventoryItem: {
    id: 'inv-1',
    name: 'Filtro de óleo',
    internalCode: 'FO-001',
    quantity: 0,
  },
};

function renderCard(overrides: Partial<ComponentProps<typeof PendingPartsCard>> = {}) {
  const props: ComponentProps<typeof PendingPartsCard> = {
    isLoading: false,
    isError: false,
    serviceOrderStatus: 'AGUARDANDO_PECA',
    pendingParts: [],
    onAdd: vi.fn(),
    onEdit: vi.fn(),
    onCancel: vi.fn(),
    onResume: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  };

  renderWithProviders(<PendingPartsCard {...props} />);
  return props;
}

describe('PendingPartsCard', () => {
  it('exibe acao de adicionar peca pendente e estado vazio', () => {
    const props = renderCard();

    expect(screen.getByText('Nenhuma peça pendente cadastrada para esta OS.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /adicionar peça/i }));
    expect(props.onAdd).toHaveBeenCalledTimes(1);
  });

  it('exibe o saldo real do estoque sem limitar pela quantidade necessaria', () => {
    const partWithMoreStockThanRequired = {
      ...pendingPart,
      status: 'AVAILABLE' as const,
      quantityAvailable: 2,
      inventoryItem: { ...pendingPart.inventoryItem, quantity: 5 },
    };
    const props = renderCard({ pendingParts: [partWithMoreStockThanRequired] });

    expect(screen.getByText('Filtro de óleo')).toBeInTheDocument();
    expect(screen.getByText('Peça disponível')).toBeInTheDocument();
    expect(screen.getByText(/Necessário:/)).toHaveTextContent('Necessário: 2 · Disponível em estoque: 5');

    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancelar pendência/i }));

    expect(props.onEdit).toHaveBeenCalledWith(partWithMoreStockThanRequired);
    expect(props.onCancel).toHaveBeenCalledWith(partWithMoreStockThanRequired);
  });

  it('mostra retomar servico apenas quando a peca esta disponivel', () => {
    const props = renderCard({
      pendingParts: [{ ...pendingPart, status: 'AVAILABLE', quantityAvailable: 3 }],
    });

    expect(screen.getByText('Peça disponível')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retomar os/i }));
    expect(props.onResume).toHaveBeenCalledTimes(1);
  });

  it('nao mostra retomar OS quando a ordem nao esta aguardando peca', () => {
    renderCard({
      serviceOrderStatus: 'EM_ANDAMENTO',
      pendingParts: [{ ...pendingPart, status: 'AVAILABLE', quantityAvailable: 3 }],
    });

    expect(screen.getByText('Peça disponível')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retomar os/i })).not.toBeInTheDocument();
  });

  it('oculta todas as acoes de alteracao no modo somente leitura', () => {
    renderCard({
      readOnly: true,
      pendingParts: [{ ...pendingPart, status: 'AVAILABLE', quantityAvailable: 3 }],
    });

    expect(screen.getByText('Peça disponível')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /adicionar peça/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retomar os/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancelar pendência/i })).not.toBeInTheDocument();
  });

  it('exibe estados loading e erro', () => {
    const props = renderCard({ isLoading: true, isError: true });

    expect(screen.getByText('Carregando peças pendentes...')).toBeInTheDocument();
    expect(screen.getByText('Não foi possível carregar as peças pendentes.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });
});
