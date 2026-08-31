import { create } from 'zustand';
import type { AdminRole } from '@/types/auth';

interface AdminAuthState {
  token: string | null;
  user: AdminAuthUser | null;
  login: (token: string, user: AdminAuthUser) => void;
  logout: () => void;
}

export interface AdminAuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN';
  adminRole: AdminRole;
}

export const useAdminAuth = create<AdminAuthState>()((set) => ({
  token: null,
  user: null,
  login: (token, user) => set({ token, user }),
  logout: () => set({ token: null, user: null }),
}));
