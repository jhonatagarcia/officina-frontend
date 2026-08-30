import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '@/services/api/http';
import { billingService } from '@/features/billing/services/billing-service';

vi.mock('@/services/api/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('billingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the authenticated workshop subscription', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: { status: 'TRIALING', billingEnabled: true },
    });

    await expect(billingService.getSubscription()).resolves.toMatchObject({
      status: 'TRIALING',
    });
    expect(http.get).toHaveBeenCalledWith('/billing/subscription');
  });

  it.each(['CREDIT_CARD', 'PIX'] as const)(
    'sends only the selected payment method and canonical plan for %s',
    async (billingType) => {
      vi.mocked(http.post).mockResolvedValue({
        data: {
          id: 'checkout-1',
          link: 'https://sandbox.asaas.com/checkoutSession/show/synthetic',
          accessChangesOnlyAfterWebhook: true,
        },
      });

      const checkout = await billingService.createCheckout(
        billingType,
        'ESSENTIAL',
      );

      expect(http.post).toHaveBeenCalledWith('/billing/checkouts', {
        billingType,
        planCode: 'ESSENTIAL',
      });
      expect(checkout.accessChangesOnlyAfterWebhook).toBe(true);
    },
  );
});
