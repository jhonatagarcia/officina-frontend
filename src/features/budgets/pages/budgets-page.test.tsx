import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BudgetsPage } from '@/features/budgets/pages/budgets-page';
import { budgetsService } from '@/features/budgets/services/budgets-service';
import type { Budget } from '@/features/budgets/types';
import { renderWithProviders } from '@/test/render-with-providers';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const original = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...original,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/features/budgets/services/budgets-service', () => ({
  budgetsService: {
    list: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    convert: vi.fn(),
    getById: vi.fn(),
  },
}));

function makeBudget(overrides: Partial<Budget>): Budget {
  return {
    id: 'budget-1',
    code: 'ORC-001',
    clientId: 'client-1',
    vehicleId: 'vehicle-1',
    status: 'PENDENTE',
    problemDescription: 'Revisao',
    notes: null,
    subtotal: 100,
    discount: 0,
    total: 100,
    convertedToServiceOrder: false,
    approvedAt: null,
    rejectedAt: null,
    createdAt: '2026-05-25T00:00:00.000Z',
    updatedAt: '2026-05-25T00:00:00.000Z',
    items: [],
    client: { id: 'client-1', name: 'Ana', document: null },
    vehicle: { id: 'vehicle-1', plate: 'ABC1D23', brand: 'Fiat', model: 'Uno', year: 2020 },
    ...overrides,
  };
}

describe('BudgetsPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('oferece edição para orçamento com OS enquanto ela não estiver entregue', async () => {
    vi.mocked(budgetsService.list).mockResolvedValueOnce({
      data: [
        makeBudget({}),
        makeBudget({ id: 'budget-2', code: 'ORC-002', status: 'APROVADO' }),
        makeBudget({
          id: 'budget-3',
          code: 'ORC-003',
          status: 'APROVADO',
          convertedToServiceOrder: true,
          serviceOrder: {
            id: 'os-1',
            orderNumber: 'OS-001',
            status: 'EM_ANDAMENTO',
            openedAt: '2026-05-25T00:00:00.000Z',
          },
        }),
        makeBudget({
          id: 'budget-4',
          code: 'ORC-004',
          status: 'APROVADO',
          convertedToServiceOrder: true,
          serviceOrder: {
            id: 'os-2',
            orderNumber: 'OS-002',
            status: 'ENTREGUE',
            openedAt: '2026-05-25T00:00:00.000Z',
          },
        }),
        makeBudget({ id: 'budget-5', code: 'ORC-005', status: 'REPROVADO' }),
      ],
      page: 1,
      pageSize: 10,
      total: 5,
      totalPages: 1,
    });

    renderWithProviders(<BudgetsPage />);

    const editButton = await screen.findByRole('button', { name: 'Editar orçamento ORC-001' });
    expect(screen.getByRole('button', { name: 'Editar orçamento ORC-002' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar orçamento ORC-003' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar orçamento ORC-004' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar orçamento ORC-005' })).not.toBeInTheDocument();

    fireEvent.click(editButton);

    expect(navigateMock).toHaveBeenCalledWith('/inicio/orcamentos/budget-1/editar');
  });
});
