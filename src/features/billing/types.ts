export type BillingType = 'CREDIT_CARD' | 'PIX';

export type BillingSubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'SUSPENDED'
  | 'CANCELED'
  | 'EXPIRED'
  | 'PILOT'
  | 'LEGACY_FREE';

export interface BillingPlan {
  code: string;
  name: string;
  description: string | null;
  entitlements: unknown;
  prices: Array<{
    id: string;
    amount: number;
    currency: string;
    cycle: 'MONTHLY' | 'YEARLY';
  }>;
}

export interface BillingSubscription {
  status: BillingSubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  graceEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  billingEnabled: boolean;
  provider: 'ASAAS';
  environment: 'SANDBOX' | 'PRODUCTION';
  plan: {
    code: string;
    name: string;
    amount: number;
    currency: string;
    cycle: 'MONTHLY' | 'YEARLY';
  } | null;
}

export interface BillingCheckout {
  id: string;
  link: string;
  status: 'ACTIVE' | 'PAID' | 'CANCELED' | 'EXPIRED' | 'FAILED';
  expiresAt: string;
  kind: 'RECURRING' | 'ONE_TIME';
  billingType: BillingType;
  accessChangesOnlyAfterWebhook: true;
}
