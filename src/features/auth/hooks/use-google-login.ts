import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/features/auth/services/auth-service';
import { useAuthStore } from '@/store/auth-store';

export function useGoogleLogin() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  const mutation = useMutation({
    mutationFn: authService.loginWithGoogle,
    onSuccess: (data) => {
      queryClient.clear();
      setSession(data);
    },
  });

  return {
    loginWithGoogle: mutation.mutateAsync,
    isGoogleLoggingIn: mutation.isPending,
    googleLoginError: mutation.error,
  };
}
