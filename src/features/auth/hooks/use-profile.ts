import { useQuery } from '@tanstack/react-query';
import { authService } from '@/features/auth/services/auth-service';
import { useAuthState } from '@/features/auth/hooks/use-auth-state';

export function useProfile() {
  const { session } = useAuthState();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.me,
    enabled: Boolean(session?.accessToken),
  });
}
