import { useAuthStore } from '@/store/auth-store';

export function useAuthState() {
  const session = useAuthStore((state) => state.session);
  const hydrated = useAuthStore((state) => state.hydrated);
  const logout = useAuthStore((state) => state.logout);

  return {
    session,
    hydrated,
    logout,
    isAuthenticated: Boolean(session?.accessToken),
    role: session?.user.role,
    user: session?.user ?? null,
  };
}
