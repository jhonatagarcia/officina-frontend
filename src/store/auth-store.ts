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
const authHttp = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
});

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
    try {
      const response = await authHttp.post<AuthSession>('/auth/refresh');
      set({ session: normalizeSession(response.data), hydrated: true });
      return true;
    } catch {
      set({ session: null, hydrated: true });
      return false;
    }
  },
  logout: async () => {
    try {
      await authHttp.post('/auth/logout');
    } catch {
      // A sessao local deve ser encerrada mesmo se o backend estiver indisponivel.
    } finally {
      set({ session: null, hydrated: true });
    }
  },
}));
