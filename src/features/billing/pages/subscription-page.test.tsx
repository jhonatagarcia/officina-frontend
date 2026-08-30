import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionPage } from '@/features/billing/pages/subscription-page';
import { billingService } from '@/features/billing/services/billing-service';

vi.mock('@/features/billing/services/billing-service', () => ({
  billingService: {
    listPlans: vi.fn(),
    getSubscription: vi.fn(),
    createCheckout: vi.fn(),
  },
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/inicio/assinatura']}>
        <SubscriptionPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SubscriptionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(billingService.listPlans).mockResolvedValue([
      {
        code: 'ESSENTIAL',
        name: 'Essencial',
        description: 'Plano inicial',
        entitlements: { includedUsers: 2 },
        prices: [
          {
            id: 'price-1',
            amount: 79.9,
            currency: 'BRL',
            cycle: 'MONTHLY',
          },
        ],
      },
    ]);
  });

  it('exibe preço canônico, status e diferenças entre cartão recorrente e Pix avulso', async () => {
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      status: 'TRIALING',
      trialEndsAt: '2026-09-09T12:00:00.000Z',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      graceEndsAt: null,
      cancelAtPeriodEnd: false,
      billingEnabled: true,
      provider: 'ASAAS',
      environment: 'SANDBOX',
      plan: null,
    });

    renderPage();

    expect(await screen.findByText('Plano Essencial')).toBeInTheDocument();
    expect(screen.getByText('R$ 79,90')).toBeInTheDocument();
    expect(screen.getByText('Período gratuito')).toBeInTheDocument();
    expect(screen.getByText(/Renovação mensal automática/)).toBeInTheDocument();
    expect(screen.getByText(/Pagamento avulso de um mês/)).toBeInTheDocument();
    expect(screen.getByText(/Sandbox: pagamentos são apenas simulações/)).toBeInTheDocument();
  });

  it('não oferece checkout para a oficina piloto permanente', async () => {
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      status: 'PILOT',
      trialEndsAt: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      graceEndsAt: null,
      cancelAtPeriodEnd: false,
      billingEnabled: true,
      provider: 'ASAAS',
      environment: 'SANDBOX',
      plan: null,
    });

    renderPage();

    expect(await screen.findByText('Oficina piloto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Assinar com cartão' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pagar um mês com Pix' })).toBeDisabled();
  });
});
