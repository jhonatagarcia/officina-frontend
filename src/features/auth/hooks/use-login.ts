import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/features/auth/services/auth-service';
import { useAuthStore } from '@/store/auth-store';

export function useLogin() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  const mutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      queryClient.clear();
      setSession(data);
    },
  });

  return {
    login: mutation.mutateAsync,
    isLoggingIn: mutation.isPending,
    loginError: mutation.error,
  };
}
