import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminApi } from '@/admin/api/admin-api';
import TenantsPage from '@/admin/tenants/TenantsPage';
import type { Tenant } from '@/admin/tenants/useTenants';

const trialTenant: Tenant = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Oficina Parceira',
  tradeName: 'Oficina Parceira',
  ownerName: 'Responsavel Sintetico',
  email: 'piloto@example.test',
  plan: 'TRIALING' as const,
  status: 'TRIALING' as const,
  isActive: true,
  createdAt: '2026-08-29T12:00:00.000Z',
  usersCount: 1,
  serviceOrdersCount: 0,
};

function renderPage(tenant: Tenant = trialTenant) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  vi.spyOn(adminApi, 'get').mockResolvedValue({
    data: { data: [tenant], meta: { total: 1, page: 1, limit: 20, pages: 1 } },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <TenantsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TenantsPage - oficina piloto', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exige justificativa e promove a oficina pelo contrato administrativo', async () => {
    const user = userEvent.setup();
    const post = vi.spyOn(adminApi, 'post').mockResolvedValue({ data: { status: 'PILOT' } });
    renderPage();

    await user.click(
      await screen.findByRole('button', {
        name: 'Definir Oficina Parceira como oficina piloto',
      }),
    );

    const confirm = screen.getByRole('button', { name: 'Confirmar oficina piloto' });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText('Justificativa'), 'Parceira do programa piloto');
    await user.click(confirm);

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        '/billing/workshops/11111111-1111-1111-1111-111111111111/pilot',
        { reason: 'Parceira do programa piloto' },
      ),
    );
  });

  it('nao oferece nova promocao para a oficina que ja e piloto', async () => {
    renderPage({ ...trialTenant, plan: 'PILOT', status: 'PILOT' });

    expect(await screen.findByText('Oficina Parceira')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /definir .* como oficina piloto/i }),
    ).not.toBeInTheDocument();
  });
});
