import { create } from 'zustand';

interface AdminAuthState {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

export const useAdminAuth = create<AdminAuthState>()((set) => ({
  token: null,
  login: (token) => set({ token }),
  logout: () => set({ token: null }),
}));
