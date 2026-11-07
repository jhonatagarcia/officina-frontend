import { useQuery } from '@tanstack/react-query';
import { billingService } from '@/features/billing/services/billing-service';
import { useAuthStore } from '@/store/auth-store';

export function useBillingAccess() {
  const hasSession = useAuthStore((state) => Boolean(state.session?.accessToken));
  const query = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: billingService.getSubscription,
    enabled: hasSession,
    staleTime: 60_000,
  });
  return { ...query, limited: query.data?.accessMode === 'LIMITED' };
}
