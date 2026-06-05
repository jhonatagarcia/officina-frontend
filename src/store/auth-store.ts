import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthSession, Role } from '@/types/auth';

interface AuthState {
  session: AuthSession | null;
  hydrated: boolean;
  setSession: (session: AuthSession | null) => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => void;
}

const validRoles = new Set<Role>(['ADMIN', 'ATENDENTE', 'MECANICO', 'FINANCEIRO']);

function normalizeSession(session: AuthSession | null): AuthSession | null {
  if (!session?.accessToken || !validRoles.has(session.user?.role)) {
    return null;
  }

  return {
    accessToken: session.accessToken,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      ...(session.user.workshop !== undefined ? { workshop: session.user.workshop } : {}),
      ...(session.user.workshopFiscalStatus !== undefined ? { workshopFiscalStatus: session.user.workshopFiscalStatus } : {}),
    },
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      hydrated: false,
      setSession: (session) => set({ session: normalizeSession(session) }),
      setHydrated: (hydrated) => set({ hydrated }),
      logout: () => set({ session: null }),
    }),
    {
      name: 'oficina-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        state?.setSession(normalizeSession(state.session));
        state?.setHydrated(true);
      },
    },
  ),
);
