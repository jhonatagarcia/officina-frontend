import { http } from '@/services/api/http';
import type {
  BillingCheckout,
  BillingPlan,
  BillingSubscription,
  BillingType,
} from '@/features/billing/types';

export const billingService = {
  async listPlans(): Promise<BillingPlan[]> {
    const response = await http.get<BillingPlan[]>('/billing/plans');
    return response.data;
  },

  async getSubscription(): Promise<BillingSubscription> {
    const response = await http.get<BillingSubscription>(
      '/billing/subscription',
    );
    return response.data;
  },

  async createCheckout(
    billingType: BillingType,
    planCode = 'ESSENTIAL',
  ): Promise<BillingCheckout> {
    const response = await http.post<BillingCheckout>('/billing/checkouts', {
      billingType,
      planCode,
    });
    return response.data;
  },
};
