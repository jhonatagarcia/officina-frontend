import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreateAccessUserDialog } from '@/features/users/components/create-access-user-dialog';
import { usersService } from '@/features/users/services/users-service';

vi.mock('@/features/users/services/users-service', () => ({
  usersService: { create: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CreateAccessUserDialog open onOpenChange={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe('CreateAccessUserDialog', () => {
  it('offers MECANICO and submits an active account without random credentials', async () => {
    vi.mocked(usersService.create).mockResolvedValueOnce({
      id: 'user-1',
      name: 'Synthetic account',
      email: 'mechanic@example.test',
      role: 'MECANICO',
      isActive: true,
      lastLoginAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const user = userEvent.setup();
    renderDialog();

    expect(screen.getByRole('combobox', { name: 'Papel' })).toHaveTextContent('Mecânico');
    await user.type(screen.getByLabelText('Nome'), 'Synthetic account');
    await user.type(screen.getByLabelText('E-mail'), 'mechanic@example.test');
    await user.type(screen.getByLabelText('Senha inicial'), 'SyntheticPassword123!');
    await user.type(screen.getByLabelText('Confirmar senha'), 'SyntheticPassword123!');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    await waitFor(() => {
      expect(usersService.create).toHaveBeenCalledWith({
        name: 'Synthetic account',
        email: 'mechanic@example.test',
        password: 'SyntheticPassword123!',
        role: 'MECANICO',
        isActive: true,
      });
    });
    expect(screen.getByText(/não gera senha automática/i)).toBeVisible();
  });
});
