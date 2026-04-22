import axios from 'axios';
import { env } from '@/lib/env';
import { emitAuthEvent } from '@/features/auth/lib/auth-events';
import { useAuthStore } from '@/store/auth-store';
import type { ApiErrorResponse } from '@/types/common';

export const http = axios.create({
  baseURL: env.VITE_API_BASE_URL,
});

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().session?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status as number | undefined;
    const payload = error.response?.data as ApiErrorResponse | undefined;

    if (status === 401) {
      useAuthStore.getState().logout();
      emitAuthEvent({ type: 'SESSION_EXPIRED' });
    } else if (status === 403) {
      emitAuthEvent({ type: 'FORBIDDEN' });
    }

    return Promise.reject(
      payload ?? {
        message: 'Não foi possível processar a solicitação.',
        statusCode: status,
      },
    );
  },
);
