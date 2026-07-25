import { create } from 'zustand';
import axios from 'axios';
import { env } from '@/lib/env';
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
  return (
    typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/admin')
  );
}

let refreshInFlight: Promise<AuthSession> | null = null;
let authStateVersion = 0;

function requestSessionRefresh(): Promise<AuthSession> {
  refreshInFlight ??= axios
    .post<AuthSession>(
      `${env.VITE_API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    )
    .then((response) => response.data)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
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
  setSession: (session) => {
    authStateVersion += 1;
    set({ session: normalizeSession(session), hydrated: true });
  },
  setHydrated: (hydrated) => set({ hydrated }),
  silentRefresh: async () => {
    if (isAdminRoute()) {
      set({ hydrated: true });
      return false;
    }

    const requestVersion = authStateVersion;

    try {
      const session = normalizeSession(await requestSessionRefresh());

      if (requestVersion === authStateVersion) {
        set({ session, hydrated: true });
      }
      return Boolean(session);
    } catch {
      if (requestVersion === authStateVersion) {
        set({ session: null, hydrated: true });
      }
      return false;
    }
  },
  logout: async () => {
    authStateVersion += 1;

    try {
      await axios.post(
        `${env.VITE_API_BASE_URL}/auth/logout`,
        {},
        { withCredentials: true },
      );
    } finally {
      set({ session: null, hydrated: true });
    }
  },
}));
