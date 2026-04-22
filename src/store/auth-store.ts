import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthSession } from '@/types/auth';

interface AuthState {
  session: AuthSession | null;
  hydrated: boolean;
  setSession: (session: AuthSession | null) => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      hydrated: false,
      setSession: (session) => set({ session }),
      setHydrated: (hydrated) => set({ hydrated }),
      logout: () => set({ session: null }),
    }),
    {
      name: 'oficina-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
