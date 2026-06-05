import { http } from '@/services/api/http';
import type { AuthSession, ForgotPasswordPayload, GoogleLoginPayload, LoginPayload, RegisterWorkshopPayload, ResetPasswordPayload } from '@/types/auth';

export const authService = {
  async login(payload: LoginPayload) {
    const response = await http.post<AuthSession>('/auth/login', payload);
    return response.data;
  },
  async loginWithGoogle(payload: GoogleLoginPayload) {
    const response = await http.post<AuthSession>('/auth/google', payload);
    return response.data;
  },
  async registerWorkshop(payload: RegisterWorkshopPayload) {
    const response = await http.post<AuthSession | { message?: string }>('/auth/signup', payload);
    return response.data;
  },
  async forgotPassword(payload: ForgotPasswordPayload) {
    const response = await http.post<{ message?: string }>('/auth/forgot-password', payload);
    return response.data;
  },
  async resetPassword(payload: ResetPasswordPayload) {
    const response = await http.post<{ message?: string }>('/auth/reset-password', payload);
    return response.data;
  },
  async me() {
    const response = await http.get<AuthSession['user']>('/auth/me');
    return response.data;
  },
};
