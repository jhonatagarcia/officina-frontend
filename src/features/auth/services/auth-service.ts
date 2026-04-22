import { http } from '@/services/api/http';
import type { AuthSession, LoginPayload } from '@/types/auth';

export const authService = {
  async login(payload: LoginPayload) {
    const response = await http.post<AuthSession>('/auth/login', payload);
    return response.data;
  },
  async me() {
    const response = await http.get<AuthSession['user']>('/auth/me');
    return response.data;
  },
};
