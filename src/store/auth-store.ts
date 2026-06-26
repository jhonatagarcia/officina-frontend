import { create } from 'zustand';
import type { AuthSession, Role } from '@/types/auth';

interface AuthState {
  session: AuthSession | null;
  hydrated: boolean;
  setSession: (session: AuthSession | null) => void;
  setHydrated: (hydrated: boolean) => void;
  silentRefresh: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const validRoles = new Set<Role>([
  'ADMIN',
  'ATENDENTE',
  'MECANICO',
  'FINANCEIRO',
]);
function isAdminRoute() {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
}

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
      ...(session.user.workshop !== undefined
        ? { workshop: session.user.workshop }
        : {}),
      ...(session.user.workshopFiscalStatus !== undefined
        ? { workshopFiscalStatus: session.user.workshopFiscalStatus }
        : {}),
    },
  };
}

export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  hydrated: false,
  setSession: (session) =>
    set({ session: normalizeSession(session), hydrated: true }),
  setHydrated: (hydrated) => set({ hydrated }),
  silentRefresh: async () => {
    if (isAdminRoute()) {
      set({ hydrated: true });
      return false;
    }

    set({ hydrated: true });
    return false;
  },
  logout: async () => {
    set({ session: null, hydrated: true });
  },
}));
