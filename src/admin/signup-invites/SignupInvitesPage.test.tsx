import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminApi } from '@/admin/api/admin-api';
import SignupInvitesPage from '@/admin/signup-invites/SignupInvitesPage';

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SignupInvitesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SignupInvitesPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lista somente metadados e nunca reconstrói o token histórico', async () => {
    vi.spyOn(adminApi, 'get').mockResolvedValue({
      data: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'piloto@example.test',
          expiresAt: '2026-08-30T12:00:00.000Z',
          usedAt: null,
          revokedAt: null,
          consumedByWorkshopId: null,
          createdAt: '2026-08-29T12:00:00.000Z',
          status: 'ACTIVE',
        },
      ],
    });

    renderPage();

    expect(await screen.findByText('piloto@example.test')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.queryByDisplayValue(/#invite=/i)).not.toBeInTheDocument();
  });

  it('exibe o link bruto somente após a criação explícita', async () => {
    const user = userEvent.setup();
    const inviteUrl =
      'https://staging.example.test/login#invite=token-sintetico';
    vi.spyOn(adminApi, 'get').mockResolvedValue({ data: [] });
    const post = vi.spyOn(adminApi, 'post').mockResolvedValue({
      data: {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'piloto@example.test',
        expiresAt: '2026-08-30T12:00:00.000Z',
        createdAt: '2026-08-29T12:00:00.000Z',
        inviteUrl,
      },
    });

    renderPage();

    await user.type(
      screen.getByRole('textbox', { name: 'E-mail do convite' }),
      'piloto@example.test',
    );
    await user.click(screen.getByRole('button', { name: 'Criar convite' }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/signup-invites', {
        email: 'piloto@example.test',
      }),
    );
    expect(await screen.findByDisplayValue(inviteUrl)).toBeInTheDocument();
    expect(
      screen.getByText(/este token não voltará a aparecer/i),
    ).toBeInTheDocument();
  });
});
