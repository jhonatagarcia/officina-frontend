import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MechanicFormPage } from '@/features/mechanics/pages/mechanic-form-page';
import { usersService } from '@/features/users/services/users-service';

vi.mock('@/features/users/services/users-service', () => ({
  usersService: { list: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/inicio/mecanicos/novo']}>
        <Routes>
          <Route
            path="/inicio/mecanicos/novo"
            element={<MechanicFormPage mode="create" />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const baseUser = {
  email: 'synthetic@example.test',
  lastLoginAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('MechanicFormPage access account selector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests the strict eligibility contract and shows only active MECANICO results', async () => {
    vi.mocked(usersService.list).mockResolvedValueOnce({
      data: [
        {
          ...baseUser,
          id: 'eligible-user',
          name: 'Eligible account',
          role: 'MECANICO',
          isActive: true,
        },
        {
          ...baseUser,
          id: 'inactive-user',
          name: 'Inactive account',
          role: 'MECANICO',
          isActive: false,
        },
        {
          ...baseUser,
          id: 'wrong-role-user',
          name: 'Wrong role account',
          role: 'ATENDENTE',
          isActive: true,
        },
      ],
      page: 1,
      pageSize: 100,
      total: 3,
      totalPages: 1,
    });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText(/vincula uma conta MECANICO existente/i)).toBeVisible();
    expect(usersService.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 100,
      active: true,
      role: 'MECANICO',
      eligibleForEmployee: true,
    });
    await user.click(screen.getAllByRole('combobox')[1]!);
    expect(screen.getByRole('option', { name: /Eligible account/ })).toBeVisible();
    expect(screen.queryByRole('option', { name: /Inactive account/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Wrong role account/ })).not.toBeInTheDocument();
  });

  it('shows a clear empty state only when the eligibility endpoint returns no account', async () => {
    vi.mocked(usersService.list).mockResolvedValueOnce({
      data: [],
      page: 1,
      pageSize: 100,
      total: 0,
      totalPages: 1,
    });
    renderPage();

    expect(
      await screen.findByText(/Nenhuma conta MECANICO ativa e sem vínculo está disponível/i),
    ).toBeVisible();
    expect(screen.queryByText(/acesso liberado/i)).not.toBeInTheDocument();
  });
});
