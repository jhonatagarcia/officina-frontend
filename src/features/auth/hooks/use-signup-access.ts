import { useQuery } from '@tanstack/react-query';
import { authService } from '@/features/auth/services/auth-service';

export function useSignupConfig() {
  return useQuery({
    queryKey: ['auth', 'signup-config'],
    queryFn: authService.getSignupConfig,
    staleTime: 60_000,
  });
}

export function useSignupInviteValidation(token?: string) {
  return useQuery({
    queryKey: ['auth', 'signup-invite-validation'],
    queryFn: () => authService.validateSignupInvite(token ?? ''),
    enabled: Boolean(token),
    retry: false,
    gcTime: 0,
  });
}
