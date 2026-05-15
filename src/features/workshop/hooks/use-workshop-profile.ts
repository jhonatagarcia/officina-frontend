import { useQuery } from '@tanstack/react-query';
import { workshopService } from '@/features/workshop/services/workshop-service';
import { useAuthState } from '@/features/auth/hooks/use-auth-state';

export function useWorkshopProfile() {
  const { isAuthenticated } = useAuthState();

  return useQuery({
    queryKey: ['workshop', 'profile'],
    queryFn: workshopService.getProfile,
    enabled: isAuthenticated,
  });
}
